import React, { useEffect, useState } from 'react';
import {
  Power,
  User,
  Building,
  CreditCard,
  Shield,
  FileText,
  Car,
  CheckSquare,
  Calendar,
  Wrench,
  Fuel,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

type DashboardData = {
  title: string;
  subtitle: string;
  kpis: Array<{
    key: string;
    label: string;
    value: number | string;
    tone: 'ok' | 'warn' | 'danger' | 'info';
    href?: string;
    hint?: string;
  }>;
  queue: Array<{
    key: string;
    label: string;
    value: number;
    href: string;
    hint?: string;
  }>;
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    let ignore = false;
    api
      .get('/dashboard/metrics')
      .then(({ data }) => {
        if (!ignore) {
          setDashData(data);
        }
      })
      .catch((err) => {
        console.error('Error al cargar métricas del dashboard:', err);
      })
      .finally(() => {
        if (!ignore) setLoadingMetrics(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="glass-panel dashboard-container mx-auto">
      <header className="dashboard-header" style={{ alignItems: 'center' }}>
        <div className="dashboard-title-group">
          <h1>Panel de Control</h1>
          <p>
            Bienvenido de vuelta, {user?.first_name} {user?.last_name}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{
            width: 'auto',
            padding: '10px 20px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            margin: '4px 0',
          }}
        >
          <Power size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* Hero Metric Banner Card */}
      <div className="mb-8">
        <HeroMetricCard
          headline="Bienvenido al Sistema de Gestión Vehicular"
          author={`${user?.first_name || ''} ${user?.last_name || ''} · ${user?.role?.name || 'Usuario'} · ${user?.faculty_institution || 'ULEAM'}`}
          tag={{
            icon: <Shield size={13} />,
            label: `Rol: ${user?.role?.name || 'Usuario'}`,
          }}
          metricValue={
            dashData?.kpis?.[0]
              ? String(dashData.kpis[0].value)
              : (loadingMetrics ? '...' : '0')
          }
          metricLabel={dashData?.kpis?.[0]?.label.toUpperCase() || 'TAREAS PENDIENTES'}
          gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
        />
      </div>

      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-primary)',
          marginBottom: '16px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-secondary)',
          }}
        ></span>
        Tu Información de Usuario
      </h2>

      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          textAlign: 'left',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #f3f4f6',
          }}
        >
          <div
            style={{
              padding: '10px',
              backgroundColor: 'rgba(197, 160, 89, 0.1)',
              color: 'var(--color-secondary)',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <CreditCard size={20} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              Cédula
            </span>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
              }}
            >
              {user?.national_id}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #f3f4f6',
          }}
        >
          <div
            style={{
              padding: '10px',
              backgroundColor: 'rgba(197, 160, 89, 0.1)',
              color: 'var(--color-secondary)',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <Building size={20} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              Facultad / Inst.
            </span>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                wordBreak: 'break-word',
                lineHeight: '1.2',
              }}
              title={user?.faculty_institution}
            >
              {user?.faculty_institution}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #f3f4f6',
          }}
        >
          <div
            style={{
              padding: '10px',
              backgroundColor: 'rgba(197, 160, 89, 0.1)',
              color: 'var(--color-secondary)',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <Shield size={20} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              Rol Asignado
            </span>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                textTransform: 'capitalize',
              }}
            >
              {user?.role?.name || 'Usuario'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #f3f4f6',
          }}
        >
          <div
            style={{
              padding: '10px',
              backgroundColor: 'rgba(197, 160, 89, 0.1)',
              color: 'var(--color-secondary)',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <User size={20} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              Correo
            </span>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                wordBreak: 'break-all',
                lineHeight: '1.2',
              }}
              title={user?.email}
            >
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-primary)',
          marginBottom: '16px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
          }}
        ></span>
        Métricas del Sistema
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashData?.kpis && dashData.kpis.length > 0 ? (
          dashData.kpis.map((kpi) => (
            <StatCard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint || 'Actualizado en tiempo real'}
              tone={kpi.tone || 'info'}
              href={kpi.href}
            />
          ))
        ) : (
          <>
            <StatCard
              label="Solicitudes"
              value={loadingMetrics ? '...' : 0}
              hint="En espera de atención"
              icon={<FileText size={16} />}
              tone="info"
              href="/app/solicitudes"
            />
            <StatCard
              label="Vehículos"
              value={loadingMetrics ? '...' : 0}
              hint="Operativos en flota"
              icon={<Car size={16} />}
              tone="ok"
              href="/app/flota/vehiculos"
            />
            <StatCard
              label="Órdenes de Trabajo"
              value={loadingMetrics ? '...' : 0}
              hint="En taller y mantenimiento"
              icon={<CheckSquare size={16} />}
              tone="neutral"
              href="/app/mantenimiento"
            />
            <StatCard
              label="Alertas Operativas"
              value={loadingMetrics ? '...' : 0}
              hint="Novedades activas"
              icon={<AlertTriangle size={16} />}
              tone="warn"
              href="/app/novedades"
            />
          </>
        )}
      </div>

      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-primary)',
          marginBottom: '16px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-secondary)',
          }}
        ></span>
        Accesos Operativos Rápidos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ResourceCard
          title="Emisión de Hojas de Ruta"
          subtitle="Asignación logística y despacho de comisiones"
          icon={<FileText size={18} />}
          href="/transporte/panel"
        />
        <ResourceCard
          title="Agenda Institucional"
          subtitle="Calendario de salidas y disponibilidad vehicular"
          icon={<Calendar size={18} />}
          href="/agenda"
        />
        <ResourceCard
          title="Taller de Mantenimiento"
          subtitle="Diagnósticos técnicos y repuestos de flota"
          icon={<Wrench size={18} />}
          href="/transporte/taller"
        />
        <ResourceCard
          title="Vales de Combustible"
          subtitle="Emisión y auditoría de recargas de combustible"
          icon={<Fuel size={18} />}
          href="/transporte/vales-combustible"
        />
        <ResourceCard
          title="Auditoría y Liquidaciones"
          subtitle="Aprobación de liquidaciones y comprobantes post-viaje"
          icon={<Shield size={18} />}
          href="/transporte/liquidaciones-auditoria"
        />
        <ResourceCard
          title="Parque Automotor"
          subtitle="Catálogo de vehículos, SOAT y matrículas"
          icon={<Car size={18} />}
          href="/transporte/vehiculos"
        />
      </div>
    </div>
  );
};

export default Dashboard;
