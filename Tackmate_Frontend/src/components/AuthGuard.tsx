import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface Props {
  children: React.ReactNode;
  role: UserRole;
}

export default function AuthGuard({ children, role }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Establishing secure connection...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== role) {
    return (
      <div className="page-loading" style={{ gap: '24px' }}>
        <div style={{ fontSize: '4rem' }}>🚫</div>
        <h2>Unauthorized Access</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Your role is <span className="badge badge-primary">{user.role}</span> but this page requires{' '}
          <span className="badge badge-accent">{role}</span>
        </p>
        <a href={`/${user.role}/dashboard`} className="geo-btn geo-btn-primary">
          Go to your Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
