import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import alertRoutes from './routes/alert.routes';
import reportRoutes from './routes/report.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';

const app = express();
const apiV1 = express.Router();

app.set('trust proxy', 1);

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

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
            // Allow requests with no origin (mobile apps, curl, Postman), or any localhost origin
            if (!origin || origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
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
app.use(sanitizeInput);

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

apiV1.use('/auth', authRoutes);
apiV1.use('/profiles', profileRoutes);
apiV1.use('/zones', zoneRoutes);
apiV1.use('/wards', wardRoutes);
apiV1.use('/incidents', incidentRoutes);
apiV1.use('/locations', locationRoutes);
apiV1.use('/trips', tripRoutes);
apiV1.use('/businesses', businessRoutes);
apiV1.use('/efirs', efirRoutes);
apiV1.use('/emergency-contacts', emergencyRoutes);
apiV1.use('/analytics', analyticsRoutes);
apiV1.use('/verify', verifyRoutes);
apiV1.use('/alerts', alertRoutes);
apiV1.use('/reports', reportRoutes);
apiV1.use('/uploads', uploadRoutes);

app.use('/api/v1', apiRateLimiter, apiV1);

// Backward compatibility with current clients while keeping versioned API available.
app.use('/api', apiRateLimiter, apiV1);

// ─── 404 ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────

app.use(errorHandler);

export default app;
