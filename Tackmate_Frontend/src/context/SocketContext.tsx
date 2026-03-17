import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token && user) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5010';
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to SafeTravel Real-time Engine');
        
        // Join role-specific rooms
        newSocket.emit('join-room', `role:${user.role}`);
        if (user.ward) {
            const wardId = typeof user.ward === 'object' ? user.ward._id : user.ward;
            newSocket.emit('join-room', `ward:${wardId}`);
        }
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
      setIsConnected(false);
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
