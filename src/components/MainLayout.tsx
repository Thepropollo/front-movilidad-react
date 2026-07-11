import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, ShieldAlert, Milestone, ClipboardList, Wrench, Fuel, Landmark, DollarSign, ShieldCheck } from 'lucide-react';
import Navbar from './Navbar';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    }
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(roleName));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Top Navbar */}
      <Navbar user={user} filteredLinks={filteredLinks} onLogout={handleLogout} />

      {/* Mobile Submenu Navigation */}
      <div className="md:hidden bg-primary/95 text-white border-t border-white/5 py-2 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex justify-around gap-1">
          {filteredLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex flex-col items-center gap-1 transition ${
                  isActive ? 'text-secondary' : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50/50 py-6 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1300px', marginLeft: 'auto', marginRight: 'auto' }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400 shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} Universidad Laica Eloy Alfaro de Manabí. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
