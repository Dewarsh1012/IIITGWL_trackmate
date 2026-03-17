import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Profile, Ward, Zone, Business } from '../models';
import { generateBlockchainId, hashGovernmentId } from '../lib/blockchain';
import { UserRole, IdType } from '../types';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question: string): Promise<string> => new Promise((resolve) => rl.question(question, resolve));

async function main() {
    try {
        await connectDatabase();
        console.log('\n--- SafeTravel v3.0 User Registration Utility ---\n');

        const email = await ask('Email: ');
        const password = await ask('Password: ');
        const full_name = await ask('Full Name: ');
        
        console.log('\nAvailable Roles:');
        Object.values(UserRole).forEach((role, i) => console.log(`${i + 1}. ${role}`));
        const roleIdx = parseInt(await ask('Select Role (number): ')) - 1;
        const role = Object.values(UserRole)[roleIdx] as UserRole;

        if (!role) {
            console.error('Invalid role selected.');
            process.exit(1);
        }

        let profileData: any = {
            email,
            password,
            full_name,
            role,
            is_active: true,
            is_verified: true
        };

        if (role === UserRole.AUTHORITY) {
            profileData.designation = await ask('Designation: ');
            profileData.department = await ask('Department: ');
        } else if (role === UserRole.RESIDENT) {
            const wards = await Ward.find().lean();
            if (wards.length === 0) {
                console.error('❌ No wards found in database. Please run seed script first.');
                process.exit(1);
            }
            console.log('\nAvailable Wards:');
            wards.forEach((w, i) => console.log(`${i + 1}. ${w.name}`));
            const wardIdx = parseInt(await ask('Select Ward (number): ')) - 1;
            if (isNaN(wardIdx) || !wards[wardIdx]) {
                console.error('Invalid ward selection.');
                process.exit(1);
            }
            profileData.ward = wards[wardIdx]._id;
        } else if (role === UserRole.BUSINESS) {
            const wards = await Ward.find().lean();
            if (wards.length === 0) {
                console.error('❌ No wards found in database.');
                process.exit(1);
            }
            console.log('\nAvailable Wards:');
            wards.forEach((w, i) => console.log(`${i + 1}. ${w.name}`));
            const wardIdx = parseInt(await ask('Select Ward (number): ')) - 1;
            if (isNaN(wardIdx) || !wards[wardIdx]) {
                console.error('Invalid ward selection.');
                process.exit(1);
            }
            profileData.ward = wards[wardIdx]._id;

            const zones = await Zone.find().lean();
            if (zones.length === 0) {
                console.error('❌ No zones found in database.');
                process.exit(1);
            }
            console.log('\nAvailable Zones:');
            zones.forEach((z, i) => console.log(`${i + 1}. ${z.name}`));
            const zoneIdx = parseInt(await ask('Select Zone (number): ')) - 1;
            if (isNaN(zoneIdx) || !zones[zoneIdx]) {
                console.error('Invalid zone selection.');
                process.exit(1);
            }
            const zone = zones[zoneIdx];

            const bName = await ask('Business Name: ');
            const category = await ask('Category (accommodation/medical/etc): ');

            profileData.tempBusiness = {
                business_name: bName,
                category,
                ward: wards[wardIdx]._id,
                zone: zone._id,
                latitude: zone.center_lat,
                longitude: zone.center_lng
            };
        } else if (role === UserRole.TOURIST) {
            console.log('\nID Types:');
            Object.values(IdType).forEach((t, i) => console.log(`${i + 1}. ${t}`));
            const idIdx = parseInt(await ask('Select ID Type (number): ')) - 1;
            const idTypes = Object.values(IdType);
            if (isNaN(idIdx) || !idTypes[idIdx]) {
                console.error('Invalid ID type selection.');
                process.exit(1);
            }
            const idType = idTypes[idIdx];
            const idNum = await ask('ID Number: ');
            
            const idHashed = hashGovernmentId(idNum);
            profileData.id_type = idType;
            profileData.id_number_hash = idHashed.hash;
            profileData.id_last_four = idHashed.lastFour;
        }

        const user = await Profile.create(profileData);
        
        // Generate Blockchain ID
        const SALT = process.env.BLOCKCHAIN_SALT || 'default-salt';
        const idHash = role === UserRole.TOURIST ? profileData.id_number_hash! : email;
        const bcId = generateBlockchainId({
            userId: String(user._id),
            role: role,
            idHash: idHash,
            issuedAt: user.created_at.toISOString(),
            salt: SALT
        });

        user.blockchain_id = bcId;
        await user.save();

        if (role === UserRole.BUSINESS && profileData.tempBusiness) {
            await Business.create({
                ...profileData.tempBusiness,
                owner: user._id,
                is_active: true,
                is_verified: true
            });
        }

        console.log(`\n✅ User Registered Successfully!`);
        console.log(`Blockchain ID: ${bcId}`);
        console.log(`Role: ${role}`);

    } catch (err) {
        console.error('\n❌ Registration failed:', err);
    } finally {
        await disconnectDatabase();
        rl.close();
    }
}

main();
