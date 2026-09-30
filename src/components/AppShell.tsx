import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calculator,
  Car,
  ChevronDown,
  FileText,
  Files,
  Fuel,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AlertsProvider } from '../context/AlertsProvider';
import NotificationBell from './NotificationBell';
import Breadcrumbs from './Breadcrumbs';
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

function getModuleIcon(moduleName: string) {
  const m = moduleName.toLowerCase();
  if (m.includes('operación') || m.includes('diaria') || m.includes('dashboard') || m.includes('inicio')) {
    return LayoutGrid;
  }
  if (m.includes('solicitud') || m.includes('autoriz')) {
    return FileText;
  }
  if (m.includes('flota') || m.includes('vehícul') || m.includes('transporte')) {
    return Car;
  }
  if (m.includes('conductor') || m.includes('chofer') || m.includes('participante')) {
    return UserCheck;
  }
  if (m.includes('garita') || m.includes('control') || m.includes('despacho')) {
    return ShieldCheck;
  }
  if (m.includes('liquidac') || m.includes('viátic') || m.includes('haber')) {
    return Calculator;
  }
  if (m.includes('combust') || m.includes('estacion')) {
    return Fuel;
  }
  if (m.includes('manten') || m.includes('taller')) {
    return Wrench;
  }
  if (m.includes('docum') || m.includes('archivo')) {
    return Files;
  }
  if (m.includes('consulta') || m.includes('report') || m.includes('auditor') || m.includes('trazab')) {
    return BarChart3;
  }
  return Layers;
}

export default function AppShell() {
  const { user, roleIds, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktop, setDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 961px)').matches
  );

  const items = useMemo(() => navForRoles(roleIds), [roleIds]);
  const grouped = useMemo(() => groupNavByModule(items), [items]);
  const home = homeForRoles(roleIds);
  const roles = roleIds
    .map((r) => SHORT_ROLE[ROLE_LABELS[r]] ?? ROLE_LABELS[r])
    .join(' · ');
  const drawerOpen = desktop || menuOpen;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 961px)');
    const sync = () => {
      setDesktop(media.matches);
      if (media.matches) setMenuOpen(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!menuOpen || desktop) return;
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
  }, [menuOpen, desktop]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <AlertsProvider>
      <div className="shell">
        <a href="#contenido-principal" className="skip-link">
          Saltar al contenido
        </a>

        {/* Topbar: Minimalist light header on desktop and mobile */}
        <header className="shell-topbar">
          <button
            type="button"
            className="shell-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="shell-sidebar"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="shell-topbar-left">
            <Breadcrumbs homePath={home} />
          </div>

          <div className="shell-topbar-right">
            <NotificationBell placement="down" />
            <span className="shell-topbar-role">{roles}</span>
            <div className="shell-topbar-user">
              <UserRound size={15} aria-hidden />
              <span>{fullName || user?.first_name || 'Usuario'}</span>
            </div>
          </div>
        </header>

        {/* Acet Labs Minimalist Monospace Sidebar */}
        <aside
          id="shell-sidebar"
          className={`shell-sidebar${menuOpen ? ' is-open' : ''}`}
          aria-label="Navegación principal"
          aria-hidden={!drawerOpen}
          {...(!drawerOpen ? { inert: true } : {})}
        >
          {/* Brand Mark (ULEAM Horizontal Logo + SIGMOV Brand) */}
          <div className="shell-brand">
            <Link to={home} className="shell-brand-link" onClick={closeMenu} title="Ir al inicio">
              <img
                src="/brand/logo-uleam-horizontal.png"
                alt="Universidad Laica Eloy Alfaro de Manabí"
                className="shell-brand-logo"
              />
              <div className="shell-brand-divider" aria-hidden="true" />
              <div className="shell-brand-text">
                <strong className="shell-brand-name">SIGMOV · ULEAM</strong>
                <small className="shell-brand-sub">Gestión y Movilidad</small>
              </div>
            </Link>
            {(isDualConductorMechanic(roleIds) ||
              isDualDocenteFacultad(roleIds)) && (
              <p className="shell-dual-note">Doble rol activo</p>
            )}
          </div>

          {/* Navigation Items (Icons + Monospace Typography) */}
          <nav className="shell-nav" aria-label="Módulos">
            {/* Dashboard Link */}
            <NavLink
              to={home}
              end
              className={({ isActive }) =>
                `shell-nav-link${isActive ? ' is-active' : ''}`
              }
              onClick={closeMenu}
            >
              <LayoutGrid size={18} aria-hidden="true" />
              <span>Dashboard</span>
            </NavLink>

            {/* Dynamic Module Groups */}
            {Object.entries(grouped).map(([module, links]) => {
              const ModuleIcon = getModuleIcon(module);
              const groupOpen = links.some((link) =>
                location.pathname.startsWith(link.path)
              );
              return (
                <details
                  key={module}
                  className="shell-nav-group"
                  open={groupOpen || undefined}
                >
                  <summary>
                    <span className="flex items-center gap-2">
                      <ModuleIcon size={16} aria-hidden="true" />
                      <span>{module}</span>
                    </span>
                    <ChevronDown size={14} aria-hidden="true" />
                  </summary>
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
                          <span>{navLabel(link, true)}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}

            {/* Logout item directly in the navigation list (matching Acet Labs reference) */}
            <button
              type="button"
              className="shell-logout-link"
              onClick={() => void handleLogout()}
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </nav>

          {/* User Profile Footer (Circular Avatar + Monospace Name at bottom) */}
          <footer className="shell-user">
            <div className="shell-user-profile">
              <div className="shell-avatar-circle" aria-hidden="true">
                {initials}
              </div>
              <div className="shell-user-info">
                <span className="shell-user-name" title={fullName || 'Usuario'}>
                  {fullName || user?.first_name || 'Usuario'}
                </span>
                <span className="shell-user-role" title={roles}>
                  {roles}
                </span>
              </div>
            </div>
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
