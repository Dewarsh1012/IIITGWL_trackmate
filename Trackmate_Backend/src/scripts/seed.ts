import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/database';
import {
    Profile, Ward, Zone, Trip, Itinerary, Business,
    EmergencyContact, Incident, EFIR, PlatformConfig
} from '../models';
import { generateBlockchainId, hashGovernmentId, generateEFIRHash } from '../lib/blockchain';

// ─────────────────────────────────────────────────────────────────────
// SEED CREDENTIALS (for testing/demo only — not real data)
// ─────────────────────────────────────────────────────────────────────
// Authority Inspector: inspector@safetravel.gov / SafeAuth2026!
// Tourist Police 1:    tp1@safetravel.gov / SafeAuth2026!
// Tourist Police 2:    tp2@safetravel.gov / SafeAuth2026!
// Ward Officer:        ward.officer@safetravel.gov / SafeAuth2026!
// Tourist Arjun:       arjun@tourist.com / Tourist2026!
// Tourist Mei:         mei@tourist.com / Tourist2026!
// Tourist Carlos:      carlos@tourist.com / Tourist2026!
// Tourist Fatima:      fatima@tourist.com / Tourist2026!
// Tourist Ravi:        ravi@tourist.com / Tourist2026!
// Tourist Yuki:        yuki@tourist.com / Tourist2026!
// Resident Priya:      priya@resident.com / Resident2026!
// Resident Tsering:    tsering@resident.com / Resident2026!
// Resident Anita:      anita@resident.com / Resident2026!
// Resident Dorji:      dorji@resident.com / Resident2026!
// Business HotelNam:   hotel@business.com / Business2026!
// Business TourGuide:  guide@business.com / Business2026!
// Business MedClinic:  clinic@business.com / Business2026!
// ─────────────────────────────────────────────────────────────────────

const SALT = process.env.BLOCKCHAIN_SALT!;
const AUTH_PASS = 'SafeAuth2026!';
const TOURIST_PASS = 'Tourist2026!';
const RESIDENT_PASS = 'Resident2026!';
const BUSINESS_PASS = 'Business2026!';

async function upsertProfile(data: any, email: string) {
    return Profile.findOneAndUpdate({ email }, data, {
        upsert: true, new: true, runValidators: false,
    });
}

async function seed() {
    await connectDatabase();
    console.log('🌱 Seeding database...');

    // Platform config
    await PlatformConfig.findOneAndUpdate(
        { key: 'authority_code' },
        { key: 'authority_code', value: process.env.AUTHORITY_CODE || 'SET_AUTHORITY_CODE_IN_ENV' },
        { upsert: true }
    );

    // ── Wards ────────────────────────────────────────────────────────
    const wardData = [
        { name: 'Tawang District', district: 'Tawang', state: 'Arunachal Pradesh', center_lat: 27.5859, center_lng: 91.8674 },
        { name: 'Sela Pass Corridor', district: 'Tawang', state: 'Arunachal Pradesh', center_lat: 27.5013, center_lng: 92.0716 },
        { name: 'Bomdila Town', district: 'West Kameng', state: 'Arunachal Pradesh', center_lat: 27.2645, center_lng: 92.4093 },
        { name: 'Dirang Valley', district: 'West Kameng', state: 'Arunachal Pradesh', center_lat: 27.3549, center_lng: 92.2406 },
    ];
    const wards = await Promise.all(
        wardData.map((w) => Ward.findOneAndUpdate({ name: w.name }, w, { upsert: true, new: true }))
    );
    console.log(`  ✓ ${wards.length} wards`);

    // ── Zones ────────────────────────────────────────────────────────
    const zoneData = [
        { name: 'Tawang Monastery Compound', risk_level: 'safe', center_lat: 27.5859, center_lng: 91.8674, radius_meters: 800, description: 'The sacred monastery complex — well-policed and tourist-friendly.' },
        { name: 'Sela Pass Road', risk_level: 'moderate', center_lat: 27.5013, center_lng: 92.0716, radius_meters: 3000, description: 'High altitude mountain pass — avalanche risk in winter.' },
        { name: 'Bumla Border Zone', risk_level: 'restricted', center_lat: 27.6671, center_lng: 91.9394, radius_meters: 5000, description: 'India-China border zone. Entry requires Inner Line Permit.' },
        { name: 'Bomdila Town Centre', risk_level: 'safe', center_lat: 27.2645, center_lng: 92.4093, radius_meters: 1200, description: 'Market area — safe for tourists and residents.' },
        { name: 'Dirang Hot Springs', risk_level: 'moderate', center_lat: 27.3549, center_lng: 92.2406, radius_meters: 1500, description: 'Popular tourist spot — variable road conditions.' },
        { name: 'Nuranang Falls Trail', risk_level: 'high', center_lat: 27.4421, center_lng: 92.1102, radius_meters: 2000, description: 'Remote trail with poor mobile coverage. Trek carefully.' },
    ];
    const zones = await Promise.all(
        zoneData.map((z) => Zone.findOneAndUpdate({ name: z.name }, { ...z, is_active: true, auto_alert: true }, { upsert: true, new: true }))
    );
    console.log(`  ✓ ${zones.length} zones`);

    // ── Authorities ──────────────────────────────────────────────────
    const authorityProfiles = [
        { email: 'inspector@safetravel.gov', full_name: 'Inspector Rajiv Sharma', designation: 'District Inspector', department: 'Police' },
        { email: 'tp1@safetravel.gov', full_name: 'Officer Lobsang Tenzin', designation: 'Tourist Police', department: 'Tourist Police' },
        { email: 'tp2@safetravel.gov', full_name: 'Officer Anita Devi', designation: 'Tourist Police', department: 'Tourist Police' },
        { email: 'ward.officer@safetravel.gov', full_name: 'Officer Tashi Wangchuk', designation: 'Ward Officer', department: 'Municipal' },
    ] as const;

    const authorityDocs = [];
    for (const ap of authorityProfiles) {
        const p = await upsertProfile({
            email: ap.email, password: AUTH_PASS, role: 'authority',
            full_name: ap.full_name, designation: ap.designation,
            department: ap.department, is_verified: true, is_active: true,
        }, ap.email);
        const bcId = generateBlockchainId({ userId: String(p._id), role: 'authority', idHash: ap.email, issuedAt: p.created_at.toISOString(), salt: SALT });
        await Profile.findByIdAndUpdate(p._id, { blockchain_id: bcId });
        authorityDocs.push(p);
    }
    console.log(`  ✓ ${authorityDocs.length} authority accounts`);

    // ── Tourists ─────────────────────────────────────────────────────
    const touristData = [
        { email: 'arjun@tourist.com', full_name: 'Arjun Mehta', id_number: 'A2345678P', id_type: 'passport', zone: zones[0], ward: wards[0] },
        { email: 'mei@tourist.com', full_name: 'Mei Tanaka', id_number: 'JP87654321', id_type: 'passport', zone: zones[1], ward: wards[1] },
        { email: 'carlos@tourist.com', full_name: 'Carlos Rivera', id_number: 'ES11223344', id_type: 'passport', zone: zones[0], ward: wards[0] },
        { email: 'fatima@tourist.com', full_name: 'Fatima Al-Hassan', id_number: 'AE55667788', id_type: 'passport', zone: zones[3], ward: wards[2] },
        { email: 'ravi@tourist.com', full_name: 'Ravi Krishnan', id_number: '456789123412', id_type: 'aadhaar', zone: zones[4], ward: wards[3] },
        { email: 'yuki@tourist.com', full_name: 'Yuki Nakamura', id_number: 'JP99112233', id_type: 'passport', zone: zones[2], ward: wards[0] },
    ];

    const touristDocs = [];
    for (const td of touristData) {
        const idHashed = hashGovernmentId(td.id_number);
        const p = await upsertProfile({
            email: td.email, password: TOURIST_PASS, role: 'tourist',
            full_name: td.full_name, id_type: td.id_type,
            id_number_hash: idHashed.hash, id_last_four: idHashed.lastFour,
            is_active: true, safety_score: 85 + Math.floor(Math.random() * 15),
        }, td.email);
        const bcId = generateBlockchainId({ userId: String(p._id), role: 'tourist', idHash: idHashed.hash, issuedAt: p.created_at.toISOString(), salt: SALT });
        await Profile.findByIdAndUpdate(p._id, { blockchain_id: bcId });

        // Create active trip
        const now = new Date();
        const start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        let trip = await Trip.findOne({ tourist: p._id });
        if (!trip) {
            trip = await Trip.create({ tourist: p._id, destination_region: 'Tawang-Bomdila Circuit', start_date: start, end_date: end, entry_point: 'Tezpur Airport', is_active: true });
        }

        // Create itinerary
        let itinerary = await Itinerary.findOne({ trip: trip._id });
        if (!itinerary) {
            const { ItineraryStop } = await import('../models');
            itinerary = await Itinerary.create({ trip: trip._id, tourist: p._id, title: `${td.full_name}'s Tawang Circuit` });
            await ItineraryStop.insertMany([
                { itinerary: itinerary._id, destination_name: 'Tawang Monastery', latitude: 27.5859, longitude: 91.8674, safety_notes: 'Well-maintained path. Entry fee: ₹50', sort_order: 0, status: 'completed', planned_arrival: start, actual_arrival: start },
                { itinerary: itinerary._id, destination_name: 'Sela Pass', latitude: 27.5013, longitude: 92.0716, safety_notes: 'Carry warm clothing. Road may be icy.', sort_order: 1, status: 'current', planned_arrival: new Date() },
                { itinerary: itinerary._id, destination_name: 'Bomdila Market', latitude: 27.2645, longitude: 92.4093, sort_order: 2, status: 'upcoming' },
                { itinerary: itinerary._id, destination_name: 'Dirang Hot Springs', latitude: 27.3549, longitude: 92.2406, sort_order: 3, status: 'upcoming' },
            ]);
        }

        touristDocs.push(p);
    }
    console.log(`  ✓ ${touristDocs.length} tourist accounts`);

    // ── Residents ────────────────────────────────────────────────────
    const residentData = [
        { email: 'priya@resident.com', full_name: 'Priya Subba', ward: wards[0] },
        { email: 'tsering@resident.com', full_name: 'Tsering Dorje', ward: wards[1] },
        { email: 'anita@resident.com', full_name: 'Anita Chakraborty', ward: wards[2] },
        { email: 'dorji@resident.com', full_name: 'Dorji Wangchuk', ward: wards[3] },
    ];
    const residentDocs = [];
    for (const rd of residentData) {
        const p = await upsertProfile({
            email: rd.email, password: RESIDENT_PASS, role: 'resident',
            full_name: rd.full_name, ward: rd.ward._id, is_active: true, is_verified: true,
        }, rd.email);
        const bcId = generateBlockchainId({ userId: String(p._id), role: 'resident', idHash: rd.email, issuedAt: p.created_at.toISOString(), salt: SALT });
        await Profile.findByIdAndUpdate(p._id, { blockchain_id: bcId });
        residentDocs.push(p);
    }
    console.log(`  ✓ ${residentDocs.length} resident accounts`);

    // ── Businesses ───────────────────────────────────────────────────
    const businessData = [
        { email: 'hotel@business.com', full_name: 'Namgyal Tsering', bName: 'Tawang Peak Guesthouse', category: 'accommodation', latitude: 27.5843, longitude: 91.8656, ward: wards[0], zone: zones[0] },
        { email: 'guide@business.com', full_name: 'Karma Wangdi', bName: 'Himalayan Trail Adventures', category: 'tour_operator', latitude: 27.5870, longitude: 91.8710, ward: wards[0], zone: zones[0] },
        { email: 'clinic@business.com', full_name: 'Dr. Meenakshi Rao', bName: 'Tawang Medical Centre', category: 'medical', latitude: 27.5820, longitude: 91.8640, ward: wards[0], zone: zones[0] },
    ];
    const businessDocs = [];
    for (const bd of businessData) {
        const p = await upsertProfile({
            email: bd.email, password: BUSINESS_PASS, role: 'business',
            full_name: bd.full_name, ward: bd.ward._id, is_active: true,
        }, bd.email);
        const bcId = generateBlockchainId({ userId: String(p._id), role: 'business', idHash: bd.email, issuedAt: p.created_at.toISOString(), salt: SALT });
        await Profile.findByIdAndUpdate(p._id, { blockchain_id: bcId });
        await Business.findOneAndUpdate(
            { owner: p._id },
            { owner: p._id, business_name: bd.bName, category: bd.category, latitude: bd.latitude, longitude: bd.longitude, ward: bd.ward._id, zone: bd.zone._id, is_verified: true, is_active: true },
            { upsert: true }
        );
        businessDocs.push(p);
    }
    console.log(`  ✓ ${businessDocs.length} business accounts`);

    // ── Incidents (15 varied) ────────────────────────────────────────
    const existingCount = await Incident.countDocuments();
    if (existingCount < 5) {
        const incidentSeeds = [
            { incident_type: 'crime', title: 'Bag Snatching at Monastery Gate', description: 'A tourist reported their bag snatched near the main gate of Tawang Monastery. Suspect fled towards the market area.', latitude: 27.5858, longitude: 91.8670, zone: zones[0]._id, ward: wards[0]._id, severity: 'high', source: 'resident_report', status: 'active', is_public: true, reporter: residentDocs[0]._id },
            { incident_type: 'medical_emergency', title: 'Altitude Sickness at Sela Pass', description: 'Tourist showing symptoms of acute mountain sickness at 13,700 ft. Needs immediate descent and medical attention.', latitude: 27.5013, longitude: 92.0716, zone: zones[1]._id, ward: wards[1]._id, severity: 'critical', source: 'sos_panic', status: 'acknowledged', is_public: false, reporter: touristDocs[1]._id },
            { incident_type: 'infrastructure_hazard', title: 'Road Landslide Block', description: 'Large landslide blocking the NH13 highway near Sela Pass. Vehicles stuck. Alternate route via forest road partially passable.', latitude: 27.4900, longitude: 92.0600, zone: zones[1]._id, ward: wards[1]._id, severity: 'high', source: 'resident_report', status: 'assigned', is_public: true, reporter: residentDocs[1]._id },
            { incident_type: 'missing_person', title: 'Tourist Missing from Group', description: 'Japanese tourist Mei Tanaka separated from tour group at Nuranang Falls. Last seen wearing red jacket at 14:30.', latitude: 27.4421, longitude: 92.1102, zone: zones[5]._id, ward: wards[1]._id, severity: 'high', source: 'authority_manual', status: 'escalated', is_public: false, reporter: authorityDocs[1]._id },
            { incident_type: 'crowd_emergency', title: 'Overcrowding at Monastery Festival', description: 'Cham festival attendance exceeded safe capacity. Crowd management required at main gate.', latitude: 27.5859, longitude: 91.8674, zone: zones[0]._id, ward: wards[0]._id, severity: 'medium', source: 'resident_report', status: 'resolved', is_public: true, reporter: residentDocs[0]._id },
            { incident_type: 'suspicious_activity', title: 'Unauthorised Photography Near Border', description: 'Individual spotted taking photographs near restricted Bumla zone boundary without IP permit.', latitude: 27.6600, longitude: 91.9300, zone: zones[2]._id, ward: wards[0]._id, severity: 'medium', source: 'authority_manual', status: 'active', is_public: false, reporter: authorityDocs[0]._id },
            { incident_type: 'accident', title: 'Vehicle Skid on Icy Road', description: 'SUV skidded off road on hairpin bend approaching Sela Pass. Two occupants with minor injuries. Vehicle partially blocking road.', latitude: 27.5100, longitude: 92.0800, zone: zones[1]._id, ward: wards[1]._id, severity: 'high', source: 'sos_panic', status: 'resolved', is_public: true, reporter: touristDocs[2]._id },
            { incident_type: 'infrastructure_hazard', title: 'Power Outage in Bomdila Market', description: 'Complete power outage affecting Bomdila Town Centre since 18:00. Shops and accommodations affected. Generator supply limited.', latitude: 27.2645, longitude: 92.4093, zone: zones[3]._id, ward: wards[2]._id, severity: 'low', source: 'resident_report', status: 'active', is_public: true, reporter: residentDocs[2]._id },
            { incident_type: 'medical_emergency', title: 'Elderly Visitor Medical Emergency', description: 'Elderly tourist collapsed at Dirang Hot Springs. CPR being administered. Ambulance dispatch requested.', latitude: 27.3549, longitude: 92.2406, zone: zones[4]._id, ward: wards[3]._id, severity: 'critical', source: 'sos_panic', status: 'assigned', is_public: false, reporter: touristDocs[4]._id },
            { incident_type: 'natural_disaster', title: 'Flash Flood Warning — Nuranang River', description: 'Heavy upstream rainfall triggering flash flood risk along Nuranang River. Tourists on trail should evacuate immediately.', latitude: 27.4421, longitude: 92.1102, zone: zones[5]._id, ward: wards[1]._id, severity: 'critical', source: 'authority_manual', status: 'active', is_public: true, reporter: authorityDocs[0]._id },
            { incident_type: 'crime', title: 'Resort Break-in Reported', description: 'Guesthouse owner reported break-in at storage area. Cash and electronics stolen. Filing FIR requested.', latitude: 27.5843, longitude: 91.8656, zone: zones[0]._id, ward: wards[0]._id, severity: 'medium', source: 'resident_report', status: 'acknowledged', is_public: false, reporter: businessDocs[0]._id },
            { incident_type: 'fire', title: 'Kitchen Fire at Restaurant', description: 'Small kitchen fire at a local dhaba near Bomdila market. Fire contained; no injuries. Health inspection required.', latitude: 27.2640, longitude: 92.4100, zone: zones[3]._id, ward: wards[2]._id, severity: 'medium', source: 'resident_report', status: 'resolved', is_public: true, reporter: residentDocs[2]._id },
            { incident_type: 'suspicious_activity', title: 'Unlicensed Tour Operator', description: 'Tourist complained about unlicensed operator collecting fees for Bumla excursion without valid Inner Line Permit facilitation.', latitude: 27.5870, longitude: 91.8710, zone: zones[0]._id, ward: wards[0]._id, severity: 'low', source: 'authority_manual', status: 'active', is_public: false, reporter: authorityDocs[2]._id },
            { incident_type: 'infrastructure_hazard', title: 'Bridge Structural Warning', description: 'Engineer inspection flags single-lane bridge on Dirang road as requiring weight restriction enforcement. Trucks should use alternative route.', latitude: 27.3600, longitude: 92.2500, zone: zones[4]._id, ward: wards[3]._id, severity: 'medium', source: 'authority_manual', status: 'active', is_public: true, reporter: authorityDocs[3]._id },
            { incident_type: 'ai_anomaly' as any, incident_type_actual: 'inactivity', title: 'AI: Tourist Inactivity Detected', description: 'Tourist Yuki Nakamura has not updated location for 45 minutes. Last known position near Bumla restricted zone boundary.', latitude: 27.6600, longitude: 91.9300, zone: zones[2]._id, ward: wards[0]._id, severity: 'high', source: 'ai_anomaly', status: 'active', is_public: false, reporter: touristDocs[5]._id, metadata: { anomaly_type: 'inactivity', confidence: 0.88, gap_minutes: 45 } },
        ];

        for (const inc of incidentSeeds) {
            const { incident_type_actual, ai_anomaly, ...rest } = inc as any;
            await Incident.create({
                ...rest,
                incident_type: incident_type_actual || rest.incident_type,
            });
        }
        console.log(`  ✓ 15 incidents seeded`);
    } else {
        console.log(`  ⏭ Incidents already seeded (${existingCount} found)`);
    }

    // ── E-FIR ────────────────────────────────────────────────────────
    const existingEFIR = await EFIR.countDocuments();
    if (existingEFIR === 0) {
        const bagSnatchIncident = await Incident.findOne({ incident_type: 'crime', status: { $ne: 'false_alarm' } });
        if (bagSnatchIncident && touristDocs[0] && authorityDocs[0]) {
            const efirPayload: Record<string, any> = {
                incident: bagSnatchIncident._id,
                user: touristDocs[0]._id,
                filed_by: authorityDocs[0]._id,
                title: 'FIR — Bag Snatching at Tawang Monastery Gate',
                description: 'On the afternoon of the occurrence, the complainant reported having their bag forcibly snatched by an unknown individual near Gate 1 of Tawang Monastery. The bag contained a passport, camera equipment valued at ₹45,000, and personal effects.',
                incident_type: 'crime',
                incident_location: 'Gate 1, Tawang Monastery Complex, Tawang, Arunachal Pradesh',
                incident_lat: 27.5858,
                incident_lng: 91.8670,
                incident_time: new Date(Date.now() - 48 * 60 * 60 * 1000),
                status: 'under_review',
                witness_statements: [
                    { name: 'Karma Sherpa (Local Vendor)', contact: '+91-9876543210', statement: 'I saw a young man in a blue jacket running towards the market after the incident. He was carrying a black backpack.' },
                ],
            };
            const hash = generateEFIRHash(efirPayload);
            await EFIR.create({ ...efirPayload, blockchain_hash: hash });
            console.log(`  ✓ 1 eFIR seeded with blockchain hash`);
        }
    } else {
        console.log(`  ⏭ EFIR already seeded`);
    }

    // ── Emergency Contacts ───────────────────────────────────────────
    for (const t of touristDocs) {
        const existing = await EmergencyContact.findOne({ user: t._id });
        if (!existing) {
            await EmergencyContact.create({ user: t._id, name: 'Indian Embassy Emergency', phone: '+91-11-24199000', relation: 'Embassy', is_primary: true });
        }
    }

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Login credentials listed in comments at top of this file.\n');
    await disconnectDatabase();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
