import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, FileText, ShieldAlert, Milestone, 
  ClipboardList, Wrench, Fuel, Landmark, DollarSign, 
  ShieldCheck, Compass, Power, Menu, X, ChevronDown, ChevronRight, Users, Car, Sun, Moon
} from 'lucide-react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Accordion state - default open if we are on a resource route
  const isResourceActive = location.pathname.startsWith('/admin/');
  const [resourcesOpen, setResourcesOpen] = useState(isResourceActive);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const roleName = user?.role?.name || '';

  const navLinks = [
    {
      label: 'Inicio',
      path: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      roles: ['solicitante', 'rector', 'jefe_transporte', 'chofer', 'mecanico']
    },
    {
      label: 'Solicitud de Viaje',
      path: '/solicitar',
      icon: <FileText size={18} />,
      roles: ['solicitante']
    },
    {
      label: 'Aprobaciones',
      path: '/rectorado',
      icon: <ShieldAlert size={18} />,
      roles: ['rector']
    },
    {
      label: 'Gestión de Transporte',
      path: '/transporte',
      icon: <Milestone size={18} />,
      roles: ['jefe_transporte']
    },
    {
      label: 'Inspección en Patio',
      path: '/inspeccion',
      icon: <ClipboardList size={18} />,
      roles: ['chofer', 'mecanico', 'jefe_transporte']
    },
    {
      label: 'Gestión de Taller',
      path: '/taller',
      icon: <Wrench size={18} />,
      roles: ['mecanico', 'jefe_transporte']
    },
    {
      label: 'Vales Combustible',
      path: '/mis-vales',
      icon: <Fuel size={18} />,
      roles: ['chofer', 'jefe_transporte']
    },
    {
      label: 'Simulador Gasolinera',
      path: '/gasolinera',
      icon: <Landmark size={18} />,
      roles: ['mecanico', 'jefe_transporte']
    },
    {
      label: 'Liquidar Viáticos',
      path: '/liquidar',
      icon: <DollarSign size={18} />,
      roles: ['solicitante', 'jefe_transporte']
    },
    {
      label: 'Auditoría Financiera',
      path: '/auditar-liquidaciones',
      icon: <ShieldCheck size={18} />,
      roles: ['jefe_transporte']
    },
    {
      label: 'Analítica y Reportes',
      path: '/analitica',
      icon: <LayoutDashboard size={18} />,
      roles: ['jefe_transporte']
    },
    {
      label: 'Auditoría de Logs',
      path: '/auditoria',
      icon: <ShieldCheck size={18} />,
      roles: ['jefe_transporte']
    }
  ];

  // We filter out main links, resource links are shown inside the accordion explicitly
  const filteredLinks = navLinks.filter(link => link.roles.includes(roleName));

  const renderResourceAccordion = (isMobile: boolean = false) => {
    if (roleName !== 'jefe_transporte') return null;

    const baseClass = isMobile 
      ? "flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-bold transition-all text-gray-300 hover:text-white hover:bg-white/5 w-full select-none"
      : "flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-gray-300 hover:text-white hover:bg-white/5 w-full select-none";

    const subLinkClass = (path: string) => {
      const isActive = location.pathname === path;
      return isMobile
        ? `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
            isActive ? 'bg-secondary text-primary dark:bg-slate-800/80 dark:text-white font-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`
        : `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
            isActive ? 'bg-secondary text-primary dark:bg-slate-800/80 dark:text-white font-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`;
    };

    return (
      <div className={isMobile ? "w-full" : "space-y-1"}>
        <button
          type="button"
          onClick={() => setResourcesOpen(!resourcesOpen)}
          className={baseClass}
        >
          <div className="flex items-center gap-3">
            <Landmark size={18} className="text-secondary" />
            <span>Gestión de Recursos</span>
          </div>
          {resourcesOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </button>

        {resourcesOpen && (
          <div className={`pl-4 space-y-1 mt-1 ${isMobile ? '' : 'border-l border-white/10 ml-6'}`}>
            <Link
              to="/admin/usuarios"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={subLinkClass('/admin/usuarios')}
            >
              <Users size={14} />
              <span>Usuarios</span>
            </Link>
            <Link
              to="/admin/choferes"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={subLinkClass('/admin/choferes')}
            >
              <ShieldCheck size={14} />
              <span>Choferes y Licencias</span>
            </Link>
            <Link
              to="/admin/vehiculos"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={subLinkClass('/admin/vehiculos')}
            >
              <Car size={14} />
              <span>Vehículos</span>
            </Link>
            <Link
              to="/admin/estaciones"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={subLinkClass('/admin/estaciones')}
            >
              <Fuel size={14} />
              <span>Estaciones / Convenios</span>
            </Link>
            <Link
              to="/admin/tarifas"
              onClick={() => isMobile && setMobileMenuOpen(false)}
              className={subLinkClass('/admin/tarifas')}
            >
              <DollarSign size={14} />
              <span>Tarifas / Haberes</span>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row w-full text-left">
      
      {/* =========================================================================== */}
      {/* DESKTOP SIDEBAR (Visible only on md and larger screens) */}
      {/* =========================================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-white h-screen fixed left-0 top-0 z-30 shadow-xl border-r border-white/5 justify-between select-none">
        
        {/* Sidebar Header: Logo & Brand */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/15 border border-secondary/35 rounded-xl flex items-center justify-center text-secondary">
              <Compass size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-tight tracking-wide text-white">ULEAM</span>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-0.5">MOVILIZACIÓN</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 py-6 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
          {filteredLinks.map((link) => {
            const isActive = location.pathname === link.path;
            
            // Insert resource accordion logically before Auditoría de Logs
            const insertAccordion = roleName === 'jefe_transporte' && link.path === '/auditoria';

            return (
              <React.Fragment key={link.path}>
                {insertAccordion && renderResourceAccordion(false)}
                
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-secondary text-primary dark:bg-slate-800/80 dark:text-white font-black shadow-md border-l-4 border-gold dark:border-blue-500' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-primary dark:text-blue-400' : 'text-secondary'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Profile info & Logout */}
        <div className="p-5 border-t border-white/5 bg-black/10 flex items-center justify-between gap-3">
          <div className="flex flex-col truncate text-left">
            <span className="font-bold text-xs text-white truncate">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[10px] text-gray-400 truncate mt-0.5">
              {user?.role?.description || 'Usuario'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/5 text-gray-300 hover:text-danger hover:bg-white/10 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <Power size={15} />
            </button>
          </div>
        </div>

      </aside>

      {/* =========================================================================== */}
      {/* MOBILE HEADER BAR (Visible only on screens smaller than md) */}
      {/* =========================================================================== */}
      <header className="md:hidden w-full bg-sidebar text-white h-16 px-4 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-40 border-b border-white/5 select-none">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-secondary/15 border border-secondary/35 rounded-lg flex items-center justify-center text-secondary">
            <Compass size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm leading-tight text-white">ULEAM</span>
            <span className="text-[8px] text-secondary font-semibold uppercase tracking-wider mt-0.5">MOVILIZACIÓN</span>
          </div>
        </div>

        {/* Mobile menu controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/5 rounded-lg transition"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </header>

      {/* Mobile Drawer (Menu expansion on click) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sidebar border-b border-white/5 py-4 px-4 flex flex-col gap-1 z-35 sticky top-16 shadow-lg select-none">
          {filteredLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const insertAccordion = roleName === 'jefe_transporte' && link.path === '/auditoria';

            return (
              <React.Fragment key={link.path}>
                {insertAccordion && renderResourceAccordion(true)}
                
                <Link
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-secondary text-primary font-black shadow-sm' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-primary' : 'text-secondary'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              </React.Fragment>
            );
          })}
          
          {/* Mobile Profile & Logout */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="font-bold text-xs text-white">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-[10px] text-gray-400">
                {user?.role?.description || 'Usuario'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-danger rounded-lg transition-all"
              >
                <Power size={13} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================== */}
      {/* MAIN VIEW AREA (Shifted md:pl-64 to clear the desktop sidebar) */}
      {/* =========================================================================== */}
      <div className="flex-grow flex flex-col min-h-screen md:pl-64 w-full">
        
        {/* Main Content Component container */}
        <main className="flex-grow py-8 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1550px', marginLeft: 'auto', marginRight: 'auto' }}>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-transparent border-t border-slate-100/50 dark:border-slate-800/30 py-4 text-center text-xs text-gray-400 shrink-0">
          <div className="max-w-7xl mx-auto px-4">
            &copy; {new Date().getFullYear()} Universidad Laica Eloy Alfaro de Manabí. Todos los derechos reservados.
          </div>
        </footer>

      </div>

    </div>
  );
};

export default MainLayout;
