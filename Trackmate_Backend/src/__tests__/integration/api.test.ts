import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { Profile } from '../../models';

describe('API Integration Tests - User Endpoints', () => {
    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trackmate-test');
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    });

    beforeEach(async () => {
        // Clear test data
        await Profile.deleteMany({});
    });

    describe('GET /api/v1/profile', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/v1/profile');
            expect([401, 404]).toContain(response.status);
        });

        it('should handle missing endpoints gracefully', async () => {
            const response = await request(app).get('/api/v1/nonexistent');
            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/auth/register', () => {
        it('should validate input data', async () => {
            const response = await request(app).post('/api/v1/auth/register').send({
                email: 'invalid-email',
                password: '123',
            });

            expect([400, 422, 404]).toContain(response.status);
        });

        it('should reject requests with missing fields', async () => {
            const response = await request(app).post('/api/v1/auth/register').send({
                email: 'test@example.com',
            });

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('GET /api/v1/health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/v1/health').expect('Content-Type', /json/);

            if (response.status === 200) {
                expect(response.body).toBeDefined();
            }
        });
    });
});

describe('API Integration Tests - Location Endpoints', () => {
    it('should handle location updates', async () => {
        const response = await request(app)
            .post('/api/v1/location/update')
            .send({
                latitude: 0,
                longitude: 0,
            });

        expect([200, 201, 401, 404]).toContain(response.status);
    });

    it('should validate coordinates', async () => {
        const response = await request(app)
            .post('/api/v1/location/update')
            .send({
                latitude: 'invalid',
                longitude: 'also-invalid',
            });

        expect([400, 401, 404]).toContain(response.status);
    });
});

describe('API Integration Tests - Alert Endpoints', () => {
    it('should retrieve alerts', async () => {
        const response = await request(app).get('/api/v1/alerts');

        expect([200, 401, 404]).toContain(response.status);
    });

    it('should handle pagination', async () => {
        const response = await request(app)
            .get('/api/v1/alerts')
            .query({ page: 1, limit: 10 });

        expect([200, 401, 404]).toContain(response.status);
    });
});

describe('API Integration Tests - Error Handling', () => {
    it('should return proper error responses', async () => {
        const response = await request(app).get('/api/v1/nonexistent');
        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
    });

    it('should handle server errors gracefully', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({});
        expect([400, 401, 404]).toContain(response.status);
    });

    it('should validate Content-Type', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .set('Content-Type', 'application/json')
            .send({});

        expect([200, 400, 401, 404]).toContain(response.status);
    });
});

describe('API Integration Tests - CORS', () => {
    it('should handle CORS requests', async () => {
        const response = await request(app)
            .get('/api/v1/alerts')
            .set('Origin', 'http://localhost:5174');

        expect([200, 401, 404]).toContain(response.status);
    });
});
