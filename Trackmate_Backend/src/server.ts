import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';
import { initSocket } from './socket';
import { startAnomalyDetection } from './lib/anomalyDetection';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap() {
    // Connect to MongoDB first
    await connectDatabase();

    // Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // Initialise Socket.IO and attach to Express app for route access
    const io = initSocket(httpServer);
    app.set('io', io);

    // Start the anomaly detection cron
    startAnomalyDetection();

    // Start listening
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 SafeTravel API v3.0 running on port ${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/health`);
        console.log(`   API:    http://localhost:${PORT}/api`);
        console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        httpServer.close(async () => {
            const { disconnectDatabase } = await import('./config/database');
            await disconnectDatabase();
            console.log('✅ Server closed. Bye!');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
