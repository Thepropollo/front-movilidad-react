import { useEffect, useState } from 'react';
import { Car, User, ShieldCheck, Wrench, UserCheck } from 'lucide-react';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

interface DisponibilidadDriver {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  national_id?: string;
  license_type?: string;
  points?: number;
  status_label: string;
  status_details?: string;
  is_selectable: boolean;
  status?: string;
  user?: {
    first_name?: string;
    last_name?: string;
  };
}

interface DisponibilidadVehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  status_label: string;
  status_details?: string;
  is_selectable: boolean;
  status?: string;
}

const DRIVER_STATUS: Record<string, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
  on_trip: { label: 'En viaje', className: 'bg-amber-100 text-amber-900' },
  no_points: { label: 'Sin puntos', className: 'bg-red-100 text-red-800' },
  expired_license: {
    label: 'Licencia vencida',
    className: 'bg-red-100 text-red-800',
  },
  no_license: { label: 'Sin licencia', className: 'bg-red-100 text-red-800' },
};

const VEHICLE_STATUS: Record<string, { label: string; className: string }> = {
  available: { label: 'Operativo', className: 'bg-green-100 text-green-800' },
  on_trip: { label: 'En viaje', className: 'bg-amber-100 text-amber-900' },
  in_maintenance: { label: 'En taller', className: 'bg-amber-100 text-amber-900' },
  inactive: { label: 'Inactivo', className: 'bg-gray-200 text-gray-700' },
  blocked_oil: {
    label: 'Requiere aceite',
    className: 'bg-red-100 text-red-800',
  },
};

const VEHICLE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'available', label: 'Operativos' },
  { key: 'on_trip', label: 'En viaje' },
  { key: 'in_maintenance', label: 'En taller' },
  { key: 'inactive', label: 'Inactivos' },
  { key: 'blocked_oil', label: 'Requieren aceite' },
];

const DRIVER_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'available', label: 'Disponibles' },
  { key: 'on_trip', label: 'En viaje' },
  { key: 'no_points', label: 'Sin puntos' },
  { key: 'expired_license', label: 'Licencia vencida' },
  { key: 'no_license', label: 'Sin licencia' },
];

const badge = (status: string, map: Record<string, { label: string; className?: string }>) => {
  const s = map[status] ?? { label: status };
  const className = map[status]?.className ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${className}`}
    >
      {s.label}
    </span>
  );
};

function FilterChips({
  filters,
  active,
  counts,
  onChange,
}: {
  filters: Array<{ key: string; label: string }>;
  active: string;
  counts: Record<string, number>;
  onChange: (key: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          style={{
            padding: '7px 14px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            background: active === f.key ? 'var(--color-primary)' : '#fff',
            color: active === f.key ? '#fff' : 'var(--text-secondary)',
            transition: 'var(--transition-smooth)',
          }}
        >
          {f.label} ({counts[f.key] ?? 0})
        </button>
      ))}
    </div>
  );
}

export default function DisponibilidadPage() {
  const [drivers, setDrivers] = useState<DisponibilidadDriver[]>([]);
  const [vehicles, setVehicles] = useState<DisponibilidadVehicle[]>([]);
  const [driverFilter, setDriverFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([modulesApi.drivers(), modulesApi.vehicles()])
      .then(([d, v]) => {
        if (!ignore) {
          setDrivers(d.data || []);
          setVehicles(v.data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('No se pudo consultar la disponibilidad de la flota.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const countBy = (list: Array<{ status_label?: string }>, key: string) =>
    list.filter((i) => i.status_label === key).length;

  const driverCounts: Record<string, number> = {
    all: drivers.length,
    ...Object.fromEntries(DRIVER_FILTERS.map((f) => [f.key, countBy(drivers, f.key)])),
  };

  const vehicleCounts: Record<string, number> = {
    all: vehicles.length,
    ...Object.fromEntries(
      VEHICLE_FILTERS.map((f) => [f.key, countBy(vehicles, f.key)])
    ),
  };

  const filteredDrivers =
    driverFilter === 'all'
      ? drivers
      : drivers.filter((d) => d.status_label === driverFilter);

  const filteredVehicles =
    vehicleFilter === 'all'
      ? vehicles
      : vehicles.filter((v) => v.status_label === vehicleFilter);

  const driversAvailable = drivers.filter((d) => d.is_selectable).length;
  const vehiclesAvailable = vehicles.filter((v) => v.is_selectable).length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Consultas Operativas"
        badgeVariant="indigo"
        title="Disponibilidad Operativa de Flota y Choferes"
        description="Monitoreo en tiempo real de unidades vehiculares y conductores habilitados para asignación inmediata a comisiones institucionales."
        metricValue={`${vehicles.length ? Math.round((vehiclesAvailable / vehicles.length) * 100) : 100}%`}
        metricLabel="DISPONIBILIDAD FLOTA"
      />

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Vehículos Listos"
          value={vehiclesAvailable}
          hint={`${vehicles.length} totales en flota`}
          icon={<Car size={16} />}
          tone="ok"
        />
        <StatCard
          label="Choferes Listos"
          value={driversAvailable}
          hint={`${drivers.length} registrados`}
          icon={<UserCheck size={16} />}
          tone="ok"
        />
        <StatCard
          label="Vehículos en Taller / Ruta"
          value={vehicles.length - vehiclesAvailable}
          hint="No disponibles"
          icon={<Wrench size={16} />}
          tone={vehicles.length - vehiclesAvailable > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Choferes Ocupados"
          value={drivers.length - driversAvailable}
          hint="En viaje / no seleccionables"
          icon={<User size={16} />}
          tone={drivers.length - driversAvailable > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ResourceCard
          title="Panel de Asignación"
          subtitle="Emitir hojas de ruta a vehículos y conductores disponibles"
          icon={<Car size={18} />}
          href="/app/secretaria/asignar"
        />
        <ResourceCard
          title="Catálogo de Vehículos"
          subtitle="Revisión documental, matrículas y SOAT"
          icon={<ShieldCheck size={18} />}
          href="/app/secretaria/flota/vehiculos"
        />
        <ResourceCard
          title="Taller de Mantenimiento"
          subtitle="Revisar novedades técnicas y reparaciones"
          icon={<Wrench size={18} />}
          href="/app/secretaria/taller"
        />
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {loading ? (
        <div className="module-panel" style={{ textAlign: 'center', padding: 48 }}>
          <span
            className="spinner"
            style={{
              display: 'inline-block',
              width: 36,
              height: 36,
              marginBottom: 12,
            }}
          />
          <p className="ops-muted">Consultando disponibilidad…</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div className="module-panel" style={{ textAlign: 'center' }}>
              <User size={22} className="text-primary" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Conductores disponibles
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 30,
                  fontWeight: 800,
                  color: 'var(--success)',
                }}
              >
                {driversAvailable}
                <span
                  style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}
                >
                  {' '}
                  / {drivers.length}
                </span>
              </p>
            </div>
            <div className="module-panel" style={{ textAlign: 'center' }}>
              <Car size={22} className="text-primary" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Vehículos operativos
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 30,
                  fontWeight: 800,
                  color: 'var(--success)',
                }}
              >
                {vehiclesAvailable}
                <span
                  style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}
                >
                  {' '}
                  / {vehicles.length}
                </span>
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            <div className="module-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} /> Conductores
              </h2>
              <FilterChips
                filters={DRIVER_FILTERS}
                active={driverFilter}
                counts={driverCounts}
                onChange={setDriverFilter}
              />
              {drivers.length === 0 ? (
                <p className="ops-muted">No hay conductores registrados.</p>
              ) : filteredDrivers.length === 0 ? (
                <p className="ops-muted">
                  No hay conductores en este estado.
                </p>
              ) : (
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.name}</strong>
                          <br />
                          <span className="ops-muted">
                            Lic. {d.license_type} · {d.points} pts
                          </span>
                        </td>
                        <td>
                          {badge(d.status_label, DRIVER_STATUS)}
                          {!d.is_selectable && (
                            <span
                              className="ops-muted"
                              style={{ display: 'block', fontSize: 12, marginTop: 4 }}
                            >
                              {d.status_details}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="module-panel">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Car size={18} /> Vehículos
              </h2>
              <FilterChips
                filters={VEHICLE_FILTERS}
                active={vehicleFilter}
                counts={vehicleCounts}
                onChange={setVehicleFilter}
              />
              {vehicles.length === 0 ? (
                <p className="ops-muted">No hay vehículos registrados.</p>
              ) : filteredVehicles.length === 0 ? (
                <p className="ops-muted">
                  No hay vehículos en este estado.
                </p>
              ) : (
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Unidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.plate}</strong>
                          <br />
                          <span className="ops-muted">
                            {v.brand} {v.model}
                          </span>
                        </td>
                        <td>
                          {badge(v.status_label, VEHICLE_STATUS)}
                          {!v.is_selectable && (
                            <span
                              className="ops-muted"
                              style={{ display: 'block', fontSize: 12, marginTop: 4 }}
                            >
                              {v.status_details}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
