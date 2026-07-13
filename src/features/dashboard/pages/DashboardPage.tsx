import React, { useState, useEffect } from 'react';
import { Power, User, Building, CreditCard, Shield, FileText, Car, Users, Fuel, DollarSign, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

interface DashboardMetrics {
  pending_requests: number;
  approved_requests: number;
  total_requests: number;
  total_vehicles: number;
  operational_vehicles: number;
  workshop_vehicles: number;
  total_drivers: number;
  available_drivers: number;
  active_fuel_orders: number;
  dispatched_fuel_orders: number;
  total_gallons: number;
  total_spent: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/metrics');
        setMetrics(response.data);
      } catch (error) {
        console.error('Error al cargar métricas del panel:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', color: 'var(--color-secondary)', borderRadius: '8px', flexShrink: 0 }}>
            <CreditCard size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Cédula</span>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.national_id}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(197, 160, 89, 0.1)', color: 'var(--color-secondary)', borderRadius: '8px', flexShrink: 0 }}>
            <Shield size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Rol Asignado</span>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user?.role?.name || 'Usuario'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando métricas dinámicas del sistema...</p>
        </div>
      ) : metrics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: Solicitudes Pendientes */}
          <div className="glass-panel info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div className="info-card-header">
              <FileText size={20} className="text-secondary" />
              <h3>Solicitudes Pendientes</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'black', fontFamily: 'monospace' }}>
              {metrics.pending_requests}
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                de {metrics.total_requests} totales
              </span>
            </p>
          </div>

          {/* Card 2: Solicitudes Aprobadas */}
          <div className="glass-panel info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div className="info-card-header">
              <ClipboardCheck size={20} className="text-emerald-500" />
              <h3>Solicitudes Aprobadas</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'black', fontFamily: 'monospace', color: '#10b981' }}>
              {metrics.approved_requests}
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                listas para despacho
              </span>
            </p>
          </div>

          {/* Card 3: Vehículos Operativos */}
          <div className="glass-panel info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div className="info-card-header">
              <Car size={20} className="text-blue-500" />
              <h3>Flota Vehicular</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'black', fontFamily: 'monospace' }}>
              {metrics.operational_vehicles}
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                operativos de {metrics.total_vehicles}
              </span>
            </p>
          </div>

          {/* Card 4: Choferes Disponibles */}
          <div className="glass-panel info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div className="info-card-header">
              <Users size={20} className="text-indigo-500" />
              <h3>Choferes Disponibles</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'black', fontFamily: 'monospace' }}>
              {metrics.available_drivers}
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                de {metrics.total_drivers} activos
              </span>
            </p>
          </div>

          {/* Card 5: Vales de Combustible Emitidos */}
          <div className="glass-panel info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div className="info-card-header">
              <Fuel size={20} className="text-amber-500" />
              <h3>Vales Emitidos</h3>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'black', fontFamily: 'monospace' }}>
              {metrics.active_fuel_orders}
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                órdenes activas
              </span>
            </p>
          </div>

          {/* Card 6: Consumo Presupuestario */}
          <div className="glass-panel info-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
            <div className="info-card-header">
              <DollarSign size={20} className="text-emerald-500" />
              <h3>Consumo Combustible</h3>
            </div>
            <p style={{ fontSize: '26px', fontWeight: 'black', fontFamily: 'monospace', color: '#10b981' }}>
              ${metrics.total_spent.toFixed(2)}
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({metrics.total_gallons.toFixed(1)} gal)
              </span>
            </p>
          </div>

        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No se pudieron cargar las métricas.
        </div>
      )}
    </div>
  );
};

export default Dashboard;
