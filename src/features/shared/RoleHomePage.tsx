import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { groupNavByModule, navForRoles, navLabel } from '../../config/navigation';
import {
  ROLE_LABELS,
  isDualConductorMechanic,
  isDualDocenteFacultad,
  type RoleId,
} from '../../config/roles';

type Props = {
  focusRoles: RoleId[];
  title: string;
  subtitle: string;
};

export default function RoleHomePage({ focusRoles, title, subtitle }: Props) {
  const { user, roleIds } = useAuth();
  const active = focusRoles.filter((r) => roleIds.includes(r));
  const items = navForRoles(active.length ? active : roleIds);
  const grouped = groupNavByModule(items);
  const primary = items.filter((i) => i.priority === 'primary');

  return (
    <section className="role-home" aria-labelledby="role-home-title">
      <header className="role-home-hero">
        <p className="module-kicker">
          {active.map((r) => ROLE_LABELS[r]).join(' · ') || 'Panel'}
        </p>
        <h1 id="role-home-title">{title}</h1>
        <p className="module-lead">
          Hola, {user?.first_name}. {subtitle}
        </p>
        {(isDualConductorMechanic(roleIds) || isDualDocenteFacultad(roleIds)) && (
          <p className="role-home-dual" role="note">
            Doble rol activo: el menú lateral agrupa las funciones de ambos perfiles.
          </p>
        )}
      </header>

      <section className="role-home-focus" aria-labelledby="focus-title">
        <h2 id="focus-title">Tareas principales</h2>
        <div className="role-home-focus-grid">
          {primary.slice(0, 4).map((link) => (
            <Link key={link.id} to={link.path} className="role-home-focus-card">
              <strong>{navLabel(link)}</strong>
              <span>{link.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="role-home-all" aria-labelledby="all-title">
        <h2 id="all-title">Todo el menú</h2>
        <div className="role-home-columns">
          {Object.entries(grouped).map(([module, links]) => (
            <div key={module} className="role-home-column">
              <h3>{module}</h3>
              <ul>
                {links.map((link) => (
                  <li key={link.id}>
                    <Link to={link.path}>{navLabel(link)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
