import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeForRoles } from '../../config/roles';

export default function NotFoundPage() {
  const { isAuthenticated, roleIds } = useAuth();
  const destination = isAuthenticated ? homeForRoles(roleIds) : '/login';

  return (
    <section className="module-page access-denied" aria-labelledby="not-found-title">
      <p className="module-kicker">Página no encontrada</p>
      <h1 id="not-found-title">No encontramos esa sección</h1>
      <p className="module-lead">
        La dirección puede haber cambiado o no está disponible para este sistema.
      </p>
      <Link className="btn btn-primary access-denied-link" to={destination}>
        {isAuthenticated ? 'Volver a mi panel' : 'Ir al inicio de sesión'}
      </Link>
    </section>
  );
}
