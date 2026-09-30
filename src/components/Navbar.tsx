import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Power } from 'lucide-react';
import type { User } from '../context/AuthContext';

interface NavbarProps {
  user: User | null;
  filteredLinks: Array<{ label: string; path: string; icon: React.ReactNode }>;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, filteredLinks, onLogout }) => {
  const location = useLocation();

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo and Brand Name */}
          <Link to="/" className="navbar-brand" title="Ir al inicio">
            <img
              src="/brand/logo-uleam-horizontal.png"
              alt="Universidad Laica Eloy Alfaro de Manabí"
              className="navbar-brand-logo"
            />
            <div className="navbar-brand-divider" aria-hidden="true" />
            <div className="navbar-brand-text">
              <span className="navbar-title">SIGMOV · ULEAM</span>
              <span className="navbar-subtitle">Sistema Institucional de Gestión y Movilidad</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="navbar-nav">
            {filteredLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${isActive ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Session Info / Logout */}
          <div className="navbar-user-block">
            <div className="navbar-user-info">
              <span className="navbar-username">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="navbar-user-role">
                {user?.role?.description || 'Usuario'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="navbar-logout-btn"
              title="Cerrar Sesión"
            >
              <Power size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
