import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { LocationLog, Zone, Profile } from '../models';
import { findZoneForPoint } from '../lib/geofence';

let io: SocketIOServer | null = null;

// Track each user's previous zone for entry/exit detection
const userZoneMap = new Map<string, string | null>();
// Track last heartbeat per user for offline detection
const userLastSeen = new Map<string, number>();

export function initSocket(httpServer: HTTPServer): SocketIOServer {
    const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
    corsOrigins.push('http://localhost:3000');
    corsOrigins.push('http://localhost:4200');

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Client announces its role to join relevant rooms
        socket.on('join:authority', () => {
            socket.join('authority_room');
            console.log(`👮 Authority joined: ${socket.id}`);
        });

        socket.on('join:ward', (wardId: string) => {
            socket.join(`ward_${wardId}`);
        });

        socket.on('join:tourist', (userId: string) => {
            socket.join(`tourist_${userId}`);
            socket.join(`user_${userId}`);
            socket.join('role_tourist');
            userLastSeen.set(userId, Date.now());
        });

        socket.on('join:resident', (userId: string) => {
            socket.join(`user_${userId}`);
            socket.join('role_resident');
            userLastSeen.set(userId, Date.now());
        });

        socket.on('join:business', (userId: string) => {
            socket.join(`user_${userId}`);
            socket.join('role_business');
            userLastSeen.set(userId, Date.now());
        });

        socket.on('join:user', (userId: string) => {
            socket.join(`user_${userId}`);
        });

        socket.on('join:zone', (zoneId: string) => {
            socket.join(`zone_${zoneId}`);
        });

        // ─── Location Update via Socket (5s interval from clients) ───
        socket.on('location_update', async (data: { userId: string; latitude: number; longitude: number; accuracy?: number; speed?: number; battery?: number }) => {
            try {
                if (!data || !data.userId) return;
                userLastSeen.set(data.userId, Date.now());

                // Find which zone this point falls in
                const zones = await Zone.find({ is_active: true }).lean();
                const matchingZone = findZoneForPoint(data.latitude, data.longitude, zones as any);
                const currentZoneId = matchingZone ? String(matchingZone._id) : null;
                const previousZoneId = userZoneMap.get(data.userId) || null;

                // Save location log (throttled — only every 5th call saves to DB)
                // The frontend sends every 5s, we save every 25s for efficiency
                const saveKey = `save_count_${data.userId}`;
                const count = ((socket as any)[saveKey] || 0) + 1;
                (socket as any)[saveKey] = count;

                if (count % 5 === 0) {
                    await LocationLog.create({
                        user: data.userId,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        accuracy_meters: data.accuracy,
                        speed: data.speed,
                        battery_level: data.battery,
                        is_in_safe_zone: matchingZone ? matchingZone.risk_level === 'safe' : false,
                        current_zone: matchingZone ? matchingZone._id : undefined,
                        source: 'gps',
                        recorded_at: new Date(),
                    });
                }

                // Zone entry/exit detection
                if (currentZoneId !== previousZoneId) {
                    userZoneMap.set(data.userId, currentZoneId);

                    if (currentZoneId && matchingZone) {
                        // User ENTERED a zone
                        io!.to(`user_${data.userId}`).emit('zone_alert', {
                            type: 'entered',
                            zone: { id: currentZoneId, name: matchingZone.name, risk_level: matchingZone.risk_level },
                            message: `You have entered ${matchingZone.name} (${matchingZone.risk_level} zone)`,
                        });

                        // If high/restricted zone, alert authority too
                        if (matchingZone.risk_level === 'high' || matchingZone.risk_level === 'restricted') {
                            io!.to('authority_room').emit('zone_breach', {
                                userId: data.userId,
                                zone: { id: currentZoneId, name: matchingZone.name, risk_level: matchingZone.risk_level },
                                latitude: data.latitude,
                                longitude: data.longitude,
                                timestamp: new Date().toISOString(),
                            });

                            // Deduct safety score for entering high-risk zones
                            const deduction = matchingZone.risk_level === 'restricted' ? -5 : -2;
                            await Profile.findByIdAndUpdate(data.userId, { $inc: { safety_score: deduction } });
                        }
                    } else if (!currentZoneId && previousZoneId) {
                        // User EXITED a zone (now outside all zones)
                        io!.to(`user_${data.userId}`).emit('zone_alert', {
                            type: 'exited',
                            zone: null,
                            message: 'You are now outside all registered zones',
                        });
                    }
                }

                // Forward to authority room for live monitoring
                io!.to('authority_room').emit('location:update', {
                    userId: data.userId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    zone: matchingZone ? { id: matchingZone._id, name: matchingZone.name, risk_level: matchingZone.risk_level } : null,
                    timestamp: new Date().toISOString(),
                });
            } catch (err) {
                console.error('Socket location_update error:', err);
            }
        });

        // Ping/pong keep-alive
        socket.on('ping', () => socket.emit('pong'));

        socket.on('disconnect', () => {
            console.log(`🔴 Socket disconnected: ${socket.id}`);
        });
    });

    // Offline detection: check every 60s for users not seen in 2 min
    setInterval(() => {
        const cutoff = Date.now() - 2 * 60 * 1000;
        for (const [userId, lastSeen] of userLastSeen.entries()) {
            if (lastSeen < cutoff) {
                io!.to('authority_room').emit('user_offline', { userId, lastSeen: new Date(lastSeen).toISOString() });
                userLastSeen.delete(userId);
            }
        }
    }, 60 * 1000);

    return io;
}

export function getIO(): SocketIOServer {
    if (!io) throw new Error('Socket.IO not initialised. Call initSocket() first.');
    return io;
}
