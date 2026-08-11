import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole, type RoleId } from '../config/roles';

type Props = {
  roles: RoleId[];
  children?: React.ReactNode;
};

export default function RoleRoute({ roles, children }: Props) {
  const { isAuthenticated, loading, roleIds } = useAuth();

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        Cargando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(roleIds, roles)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
