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
        console.log('Connected to Trackmate Real-time Engine');
        
        // Join role-specific rooms using the backend's socket events
        if (user.role === 'authority') {
            newSocket.emit('join:authority');
        } else if (user.role === 'tourist') {
            newSocket.emit('join:tourist', user.id);
        } else if (user.role === 'resident') {
            newSocket.emit('join:resident', user.id);
        } else if (user.role === 'business') {
            newSocket.emit('join:business', user.id);
        }
        // Also join generic user room for personal alerts
        newSocket.emit('join:user', user.id);

        if (user.ward) {
            const wardId = typeof user.ward === 'object' ? user.ward._id : user.ward;
            newSocket.emit('join:ward', wardId);
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
