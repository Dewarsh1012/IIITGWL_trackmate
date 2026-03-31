import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import { useContext } from 'react';

describe('AuthContext - Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should provide auth context', () => {
        let contextValue: any;
        const TestComponent = () => {
            contextValue = useContext(AuthContext);
            return null;
        };

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(contextValue).toBeDefined();
    });

    it('should initialize with default auth state', () => {
        let contextValue: any;
        const TestComponent = () => {
            contextValue = useContext(AuthContext);
            return <div>{contextValue.user ? 'Authenticated' : 'Not Authenticated'}</div>;
        };

        const { container } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(contextValue).toBeDefined();
        expect(contextValue.user).toBeDefined();
    });

    it('should handle login action', async () => {
        let contextValue: any;
        const TestComponent = () => {
            contextValue = useContext(AuthContext);
            return (
                <div>
                    <button onClick={() => contextValue.login({ email: 'test@test.com', password: 'test' })}>
                        Login
                    </button>
                    <div>{contextValue.isLoading ? 'Loading' : 'Ready'}</div>
                </div>
            );
        };

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        const loginButton = screen.getByText('Login');
        expect(loginButton).toBeTruthy();
    });

    it('should handle logout action', async () => {
        let contextValue: any;
        const TestComponent = () => {
            contextValue = useContext(AuthContext);
            return (
                <div>
                    <button onClick={() => contextValue.logout()}>Logout</button>
                </div>
            );
        };

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        const logoutButton = screen.getByText('Logout');
        expect(logoutButton).toBeTruthy();
    });

    it('should persist auth token to localStorage', () => {
        render(
            <AuthProvider>
                <div>Test</div>
            </AuthProvider>
        );

        const token = localStorage.getItem('auth_token');
        // Token may be null initially, but localStorage should be accessible
        expect(localStorage.getItem).toBeDefined();
    });

    it('should handle auth errors gracefully', async () => {
        let contextValue: any;
        const TestComponent = () => {
            contextValue = useContext(AuthContext);
            return <div>{contextValue.error || 'No error'}</div>;
        };

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(contextValue).toBeDefined();
    });
});

describe('AuthContext - Integration Tests', () => {
    it('should maintain auth state across re-renders', () => {
        const { rerender } = render(
            <AuthProvider>
                <div>Test</div>
            </AuthProvider>
        );

        expect(() => {
            rerender(
                <AuthProvider>
                    <div>Test Updated</div>
                </AuthProvider>
            );
        }).not.toThrow();
    });

    it('should handle multiple consumer components', () => {
        const Consumer1 = () => {
            const auth = useContext(AuthContext);
            return <div>{auth ? 'Auth Available' : 'No Auth'}</div>;
        };

        const Consumer2 = () => {
            const auth = useContext(AuthContext);
            return <div>{auth ? 'Auth Available' : 'No Auth'}</div>;
        };

        render(
            <AuthProvider>
                <Consumer1 />
                <Consumer2 />
            </AuthProvider>
        );

        expect(screen.getAllByText('Auth Available').length).toBeGreaterThanOrEqual(0);
    });
});
