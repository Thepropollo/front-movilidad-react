import React from 'react';
import { Power, User, Building, CreditCard, Shield, FileText, Car, CheckSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Valores mock de métricas para la demostración de la lógica dinámica
  const metrics = {
    pendientes: 0,
    operativos: 0,
    activas: 0
  };

  return (
    <div className="glass-panel dashboard-container mx-auto">
      <header className="dashboard-header" style={{ alignItems: 'center' }}>
        <div className="dashboard-title-group">
          <h1>Panel de Control</h1>
          <p>Bienvenido de vuelta, {user?.first_name} {user?.last_name}</p>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-secondary" 
          style={{ width: 'auto', padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' }}
        >
          <Power size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)' }}></span>
        Tu Información de Usuario
      </h2>
      
      <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', textAlign: 'left', marginBottom: '32px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', color: 'var(--color-secondary)', borderRadius: '8px', flexShrink: 0 }}>
            <CreditCard size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Cédula</span>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.national_id}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', color: 'var(--color-secondary)', borderRadius: '8px', flexShrink: 0 }}>
            <Building size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Facultad / Inst.</span>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.2' }} title={user?.faculty_institution}>
              {user?.faculty_institution}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', color: 'var(--color-secondary)', borderRadius: '8px', flexShrink: 0 }}>
            <Shield size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Rol Asignado</span>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user?.role?.name || 'Usuario'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', color: 'var(--color-secondary)', borderRadius: '8px', flexShrink: 0 }}>
            <User size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Correo</span>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: '1.2' }} title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
        Métricas del Sistema
      </h2>

      <div className="grid-3">
        <div className="glass-panel info-card">
          <div className="info-card-header">
            <FileText size={20} />
            <h3>Solicitudes</h3>
          </div>
          <p>{metrics.pendientes} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{metrics.pendientes === 1 ? 'Pendiente' : 'Pendientes'}</span></p>
        </div>

        <div className="glass-panel info-card">
          <div className="info-card-header">
            <Car size={20} />
            <h3>Vehículos</h3>
          </div>
          <p>{metrics.operativos} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{metrics.operativos === 1 ? 'Operativo' : 'Operativos'}</span></p>
        </div>

        <div className="glass-panel info-card">
          <div className="info-card-header">
            <CheckSquare size={20} />
            <h3>Órdenes</h3>
          </div>
          <p>{metrics.activas} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>{metrics.activas === 1 ? 'Activa' : 'Activas'}</span></p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
