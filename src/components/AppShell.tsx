import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AlertsProvider } from '../context/AlertsProvider';
import NotificationBell from './NotificationBell';
import { groupNavByModule, navForRoles, navLabel } from '../config/navigation';
import {
  ROLE_LABELS,
  homeForRoles,
  isDualConductorMechanic,
  isDualDocenteFacultad,
} from '../config/roles';

const SHORT_ROLE: Record<string, string> = {
  'Secretaría / Administrativo': 'Secretaría',
  'Responsable de Facultad': 'Facultad',
};

export default function AppShell() {
  const { user, roleIds, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = useMemo(() => navForRoles(roleIds), [roleIds]);
  const grouped = useMemo(() => groupNavByModule(items), [items]);
  const home = homeForRoles(roleIds);
  const roles = roleIds
    .map((r) => SHORT_ROLE[ROLE_LABELS[r]] ?? ROLE_LABELS[r])
    .join(' · ');

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  const showAlerts = roleIds.includes('secretaria');

  return (
    <AlertsProvider>
      <div className="shell">
        <a href="#contenido-principal" className="skip-link">
          Saltar al contenido
        </a>

        <header className="shell-mobilebar">
          <button
            type="button"
            className="shell-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="shell-sidebar"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="sr-only">Menú</span>
          </button>
          <Link to={home} className="shell-mobilebar-brand" onClick={closeMenu}>
            ULEAM Movilidad
          </Link>
          <span className="shell-mobilebar-role">{roles}</span>
          {showAlerts && <NotificationBell placement="down" />}
        </header>

        <aside
          id="shell-sidebar"
          className={`shell-sidebar${menuOpen ? ' is-open' : ''}`}
          aria-label="Navegación principal"
        >
          <div className="shell-brand">
            <div className="shell-brand-row">
              <Link to={home} className="shell-brand-link" onClick={closeMenu}>
                <span className="shell-logo" aria-hidden>
                  <img
                    src="/logo-uleam-cara.png"
                    alt=""
                    className="shell-logo-img"
                  />
                </span>
                <span>
                  <strong className="shell-brand-title">ULEAM Movilidad</strong>
                  <span className="shell-brand-sub">
                    Transporte institucional
                  </span>
                </span>
              </Link>
              {showAlerts && <NotificationBell placement="right" />}
            </div>
            <p className="shell-role-line">{roles}</p>
            {(isDualConductorMechanic(roleIds) ||
              isDualDocenteFacultad(roleIds)) && (
              <p className="shell-dual-note">Doble rol activo</p>
            )}
          </div>

          <nav className="shell-nav" aria-label="Módulos">
            {Object.entries(grouped).map(([module, links]) => (
              <div key={module} className="shell-nav-group">
                <p className="shell-nav-group-title">{module}</p>
                <ul>
                  {links.map((link) => (
                    <li key={link.id}>
                      <NavLink
                        to={link.path}
                        className={({ isActive }) =>
                          `shell-nav-link${isActive ? ' is-active' : ''}`
                        }
                        onClick={closeMenu}
                      >
                        {navLabel(link, true)}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <footer className="shell-user">
            <p className="shell-user-name">
              {user?.first_name} {user?.last_name}
            </p>
            {user?.faculty_institution && (
              <p className="shell-user-meta">{user.faculty_institution}</p>
            )}
            <button
              type="button"
              className="shell-logout"
              onClick={() => void handleLogout()}
            >
              <LogOut size={16} aria-hidden />
              Cerrar sesión
            </button>
          </footer>
        </aside>

        {menuOpen && (
          <button
            type="button"
            className="shell-backdrop"
            aria-label="Cerrar menú"
            onClick={closeMenu}
          />
        )}

        <main id="contenido-principal" className="shell-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </AlertsProvider>
  );
}
