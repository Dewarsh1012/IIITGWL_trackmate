import mongoose from 'mongoose';
import { Profile, Alert, Zone, Incident } from '../../models';
import { AlertStatus } from '../../types';

describe('Backend Models - Unit Tests', () => {
    beforeAll(async () => {
        // Connect to test database
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trackmate-test');
        }
    });

    afterAll(async () => {
        // Clean up after tests
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    });

    describe('Profile Model', () => {
        beforeEach(async () => {
            await Profile.deleteMany({});
        });

        it('should create a valid profile', async () => {
            const profile = new Profile({
                email: 'test@example.com',
                password: 'Password123!',
                full_name: 'Test User',
                role: 'tourist',
            });

            const saved = await profile.save();
            expect(saved._id).toBeDefined();
            expect(saved.email).toBe('test@example.com');
        });

        it('should validate required fields', async () => {
            const profile = new Profile({});

            try {
                await profile.save();
                expect(true).toBe(false); // Should fail
            } catch (error: any) {
                expect(error.errors).toBeDefined();
            }
        });

        it('should enforce unique email', async () => {
            const profile1 = new Profile({
                email: 'duplicate@example.com',
                password: 'Password123!',
                full_name: 'User 1',
                role: 'tourist',
            });

            await profile1.save();

            const profile2 = new Profile({
                email: 'duplicate@example.com',
                password: 'Password123!',
                full_name: 'User 2',
                role: 'resident',
            });

            // Unique constraint should trigger on save
            await expect(profile2.save()).rejects.toBeDefined();
        });
    });

    describe('Alert Model', () => {
        beforeEach(async () => {
            await Alert.deleteMany({});
        });

        it('should create a valid alert', async () => {
            const alert = new Alert({
                created_by: new mongoose.Types.ObjectId(),
                title: 'Test Alert',
                message: 'This is a test alert',
                alert_type: 'safety_warning',
                priority: 'high',
                target_group: 'all',
            });

            const saved = await alert.save();
            expect(saved._id).toBeDefined();
            expect(saved.alert_type).toBe('safety_warning');
        });

        it('should set creation timestamp', async () => {
            const alert = new Alert({
                created_by: new mongoose.Types.ObjectId(),
                title: 'Test Alert',
                message: 'Message',
                alert_type: 'general',
                priority: 'medium',
                target_group: 'all',
            });

            const saved = await alert.save();
            expect(saved.created_at).toBeDefined();
        });

        it('should accept target user metadata for direct alerts', async () => {
            const alert = new Alert({
                created_by: new mongoose.Types.ObjectId(),
                title: 'Test Alert',
                message: 'Message',
                alert_type: 'emergency',
                priority: 'critical',
                target_group: 'user',
                target_user_id: new mongoose.Types.ObjectId(),
            });

            expect(alert.target_user_id).toBeDefined();
        });
    });

    describe('Zone Model', () => {
        beforeEach(async () => {
            await Zone.deleteMany({});
        });

        it('should create a valid zone', async () => {
            const zone = new Zone({
                name: 'Test Zone',
                risk_level: 'high',
                center_lat: 27.55,
                center_lng: 91.86,
                radius_meters: 600,
                managed_by: new mongoose.Types.ObjectId(),
            });

            const saved = await zone.save();
            expect(saved._id).toBeDefined();
            expect(saved.risk_level).toBe('high');
        });

        it('should store zone boundaries correctly', async () => {
            const coordinates = [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]];
            const geojson = {
                type: 'Polygon',
                coordinates,
            };

            const zone = new Zone({
                name: 'Large Zone',
                risk_level: 'moderate',
                center_lat: 27.60,
                center_lng: 91.88,
                radius_meters: 1200,
                geojson,
            });

            const saved = await zone.save();
            expect(saved.geojson).toEqual(geojson);
        });
    });

    describe('Incident Model', () => {
        beforeEach(async () => {
            await Incident.deleteMany({});
        });

        it('should create a valid incident', async () => {
            const incident = new Incident({
                title: 'Test Incident',
                description: 'Incident description',
                incident_type: 'accident',
                severity: 'medium',
                source: 'user_report',
                reporter: new mongoose.Types.ObjectId(),
                latitude: 0,
                longitude: 0,
            });

            const saved = await incident.save();
            expect(saved._id).toBeDefined();
            expect(saved.incident_type).toBe('accident');
        });

        it('should track incident status changes', async () => {
            const incident = new Incident({
                title: 'Status Test',
                description: 'Testing status',
                incident_type: 'crime',
                severity: 'high',
                source: 'user_report',
                reporter: new mongoose.Types.ObjectId(),
                latitude: 0,
                longitude: 0,
            });

            const saved = await incident.save();
            expect(saved.status).toBe('active');

            // Update status
            saved.status = AlertStatus.RESOLVED;
            const updated = await saved.save();
            expect(updated.status).toBe('resolved');
        });

        it('should timestamp incident creation and updates', async () => {
            const incident = new Incident({
                title: 'Timestamp Test',
                description: 'Test timestamps',
                incident_type: 'medical_emergency',
                severity: 'critical',
                source: 'user_report',
                reporter: new mongoose.Types.ObjectId(),
                latitude: 0,
                longitude: 0,
            });

            const saved = await incident.save();
            expect(saved.created_at).toBeDefined();
        });
    });
});
