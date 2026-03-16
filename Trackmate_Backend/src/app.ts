import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Route imports
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import zoneRoutes from './routes/zone.routes';
import wardRoutes from './routes/ward.routes';
import incidentRoutes from './routes/incident.routes';
import locationRoutes from './routes/location.routes';
import tripRoutes from './routes/trip.routes';
import businessRoutes from './routes/business.routes';
import efirRoutes from './routes/efir.routes';
import emergencyRoutes from './routes/emergency.routes';
import analyticsRoutes from './routes/analytics.routes';
import verifyRoutes from './routes/verify.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
allowedOrigins.push('http://localhost:3000');
allowedOrigins.push('http://localhost:4200');
allowedOrigins.push('http://10.0.2.2:5000'); // Android emulator → host

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, Postman)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS policy: origin ${origin} is not allowed`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400, // Cache preflight for 24h
    })
);

// ─── Body Parsing ────────────────────────────────────────────────────

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Static uploads ──────────────────────────────────────────────────

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        service: 'SafeTravel API',
    });
});

// ─── API Routes ──────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/efirs', efirRoutes);
app.use('/api/emergency-contacts', emergencyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/verify', verifyRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────

app.use(errorHandler);

export default app;
