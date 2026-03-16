import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
    const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
    corsOrigins.push('http://localhost:3000'); // Flutter web dev
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
        });

        // Ping/pong keep-alive
        socket.on('ping', () => socket.emit('pong'));

        socket.on('disconnect', () => {
            console.log(`🔴 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO(): SocketIOServer {
    if (!io) throw new Error('Socket.IO not initialised. Call initSocket() first.');
    return io;
}
