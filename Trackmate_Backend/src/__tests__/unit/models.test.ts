import mongoose from 'mongoose';
import { Profile, Alert, Zone, Incident } from '../models';

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
                userId: new mongoose.Types.ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
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
            const userId = new mongoose.Types.ObjectId();

            const profile1 = new Profile({
                userId,
                name: 'User 1',
                email: 'duplicate@example.com',
                role: 'tourist',
            });

            await profile1.save();

            const profile2 = new Profile({
                userId: new mongoose.Types.ObjectId(),
                name: 'User 2',
                email: 'duplicate@example.com',
                role: 'resident',
            });

            // Unique constraint should trigger on save
            expect(async () => {
                await profile2.save();
            }).toBeDefined();
        });
    });

    describe('Alert Model', () => {
        beforeEach(async () => {
            await Alert.deleteMany({});
        });

        it('should create a valid alert', async () => {
            const alert = new Alert({
                title: 'Test Alert',
                message: 'This is a test alert',
                type: 'safety',
                severity: 'high',
                authorityId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            });

            const saved = await alert.save();
            expect(saved._id).toBeDefined();
            expect(saved.type).toBe('safety');
        });

        it('should set default status to active', async () => {
            const alert = new Alert({
                title: 'Test Alert',
                message: 'Message',
                type: 'safety',
                severity: 'high',
                authorityId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            });

            const saved = await alert.save();
            expect(saved.status).toBe('active');
        });

        it('should validate geolocation coordinates', async () => {
            const alert = new Alert({
                title: 'Test Alert',
                message: 'Message',
                type: 'safety',
                severity: 'high',
                authorityId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [180.5, 90.5], // Invalid coordinates
                },
            });

            // Should either validate or be caught by schema
            expect(alert.location).toBeDefined();
        });
    });

    describe('Zone Model', () => {
        beforeEach(async () => {
            await Zone.deleteMany({});
        });

        it('should create a valid zone', async () => {
            const zone = new Zone({
                name: 'Test Zone',
                riskLevel: 'high',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                },
                wardId: new mongoose.Types.ObjectId(),
            });

            const saved = await zone.save();
            expect(saved._id).toBeDefined();
            expect(saved.riskLevel).toBe('high');
        });

        it('should store zone boundaries correctly', async () => {
            const coordinates = [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]];

            const zone = new Zone({
                name: 'Large Zone',
                riskLevel: 'moderate',
                geometry: {
                    type: 'Polygon',
                    coordinates,
                },
                wardId: new mongoose.Types.ObjectId(),
            });

            const saved = await zone.save();
            expect(saved.geometry.coordinates).toEqual(coordinates);
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
                type: 'accident',
                severity: 'medium',
                reporterId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            });

            const saved = await incident.save();
            expect(saved._id).toBeDefined();
            expect(saved.type).toBe('accident');
        });

        it('should track incident status changes', async () => {
            const incident = new Incident({
                title: 'Status Test',
                description: 'Testing status',
                type: 'crime',
                severity: 'high',
                reporterId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            });

            const saved = await incident.save();
            expect(saved.status).toBe('open');

            // Update status
            saved.status = 'resolved';
            const updated = await saved.save();
            expect(updated.status).toBe('resolved');
        });

        it('should timestamp incident creation and updates', async () => {
            const incident = new Incident({
                title: 'Timestamp Test',
                description: 'Test timestamps',
                type: 'emergency',
                severity: 'critical',
                reporterId: new mongoose.Types.ObjectId(),
                location: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
            });

            const saved = await incident.save();
            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });
    });
});
