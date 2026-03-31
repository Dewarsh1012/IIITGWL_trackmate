import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';
import type { User, UserRole } from '../types';

export type { User, UserRole };

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (data: Record<string, unknown>) => Promise<{ user: User; blockchainId: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/auth/me')
                .then((res) => {
                    setUser(res.data.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const login = async (email: string, password: string): Promise<User> => {
        const res = await api.post('/auth/login', { email, password });
        const { accessToken, user: u } = res.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(u));
        setToken(accessToken);
        setUser(u);
        return u;
    };

    const register = async (data: Record<string, unknown>) => {
        const res = await api.post('/auth/register', data);
        const { accessToken, blockchainId, user: u } = res.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(u));
        setToken(accessToken);
        setUser(u);
        return { user: u, blockchainId };
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
