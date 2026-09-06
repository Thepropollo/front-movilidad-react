import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole, homeForRoles, type RoleId } from '../config/roles';

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
    return (
      <section className="module-page access-denied" aria-labelledby="access-denied-title">
        <p className="module-kicker">Acceso restringido</p>
        <h1 id="access-denied-title">No tienes permiso para ver este módulo</h1>
        <p className="module-lead">
          Tu cuenta está activa, pero este flujo está disponible para otro perfil
          institucional.
        </p>
        <Link className="btn btn-primary access-denied-link" to={homeForRoles(roleIds)}>
          Volver a mi panel
        </Link>
      </section>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
