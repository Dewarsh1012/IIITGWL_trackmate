import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockedApi = api as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
};

function AuthProbe() {
    const { user, isLoading, login, logout } = useAuth();

    return (
        <div>
            <div data-testid="loading-state">{isLoading ? 'loading' : 'ready'}</div>
            <div data-testid="user-id">{user?.id || 'none'}</div>
            <button onClick={() => void login('demo@trackmate.app', 'secret')}>login</button>
            <button onClick={() => logout()}>logout</button>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        mockedApi.get.mockResolvedValue({ data: { data: null } });
    });

    it('starts with no user when there is no token', async () => {
        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading-state').textContent).toBe('ready');
        });

        expect(screen.getByTestId('user-id').textContent).toBe('none');
    });

    it('logs in and persists token', async () => {
        mockedApi.post.mockResolvedValue({
            data: {
                data: {
                    accessToken: 'token-123',
                    user: {
                        id: 'user-1',
                        email: 'demo@trackmate.app',
                        full_name: 'Demo User',
                        role: 'business',
                    },
                },
            },
        });

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'login' }));

        await waitFor(() => {
            expect(screen.getByTestId('user-id').textContent).toBe('user-1');
        });

        expect(localStorage.getItem('token')).toBe('token-123');
    });

    it('restores session from existing token and supports logout', async () => {
        localStorage.setItem('token', 'existing-token');

        mockedApi.get.mockResolvedValue({
            data: {
                data: {
                    id: 'restored-user',
                    email: 'restored@trackmate.app',
                    full_name: 'Restored User',
                    role: 'business',
                },
            },
        });

        render(
            <AuthProvider>
                <AuthProbe />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-id').textContent).toBe('restored-user');
        });

        fireEvent.click(screen.getByRole('button', { name: 'logout' }));

        await waitFor(() => {
            expect(screen.getByTestId('user-id').textContent).toBe('none');
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('throws outside provider', () => {
        function UnsafeConsumer() {
            useAuth();
            return <div>unsafe</div>;
        }

        expect(() => render(<UnsafeConsumer />)).toThrow('useAuth must be used within AuthProvider');
    });
});
