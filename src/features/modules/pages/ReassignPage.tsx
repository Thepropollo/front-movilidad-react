import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Truck,
  UserCheck,
  Users,
  Car,
  Clock,
} from 'lucide-react';
import { DRIVER_RESPONSE_LABEL, labelOf } from '@/lib/labels';
import { formatDateReadable } from '@/lib/datetime';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

interface TripRecord {
  id: number;
  driver_response: string;
  driver_reject_reason?: string;
  request?: {
    id?: number;
    destination?: string;
    origin?: string;
    departure_date?: string;
  };
  driver?: {
    id?: number;
    user?: {
      first_name?: string;
      last_name?: string;
    };
  };
  vehicle?: {
    id?: number;
    plate?: string;
    brand?: string;
    model?: string;
  };
}

interface DriverRecord {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  is_selectable?: boolean;
  status_details?: string;
}

interface VehicleRecord {
  id: number;
  plate: string;
  brand: string;
  model: string;
  is_selectable?: boolean;
}

export default function ReassignPage() {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [form, setForm] = useState<
    Record<number, { driver_id: string; vehicle_id: string }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = async () => {
    const { data } = await modulesApi.myTrips();
    setTrips(
      ((data || []) as TripRecord[]).filter((x) =>
        ['rechazado', 'pendiente'].includes(x.driver_response)
      )
    );
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      modulesApi.myTrips(),
      modulesApi.drivers(),
      modulesApi.vehicles(),
    ])
      .then(([t, d, v]) => {
        if (!ignore) {
          setTrips(
            ((t.data || []) as TripRecord[]).filter((x) =>
              ['rechazado', 'pendiente'].includes(x.driver_response)
            )
          );
          setDrivers((d.data || []) as DriverRecord[]);
          setVehicles((v.data || []) as VehicleRecord[]);
        }
      })
      .catch(() => {
        if (!ignore) setError('No se pudo cargar reasignaciones.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const submit = async (id: number) => {
    setMsg(null);
    setError(null);
    setSavingId(id);
    try {
      const f = form[id];
      const { data } = await modulesApi.reassign(id, {
        driver_id: Number(f?.driver_id),
        vehicle_id: f?.vehicle_id ? Number(f.vehicle_id) : undefined,
      });
      setMsg(data.message);
      setForm((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
      await loadTrips();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al reasignar.');
    } finally {
      setSavingId(null);
    }
  };

  const rechazadosCount = trips.filter((t) => t.driver_response === 'rechazado').length;
  const pendientesCount = trips.filter((t) => t.driver_response === 'pendiente').length;
  const availableDriversCount = drivers.filter((d) => d.is_selectable).length;
  const availableVehiclesCount = vehicles.filter((v) => v.is_selectable).length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Centro de Reasignaciones"
        badgeVariant="amber"
        title="Reasignación Operativa de Choferes y Flota"
        description="Gestión inmediata de comisiones con rechazo o pendientes de confirmación. Reasigne un chofer disponible o reemplace la unidad vehicular para asegurar el cumplimiento oportuno de la agenda."
        metricValue={String(trips.length)}
        metricLabel="COMISIONES POR REASIGNAR"
        actionLabel="Actualizar Lista"
        onAction={() => void loadTrips()}
        actionLoading={loading}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total por Reasignar"
          value={trips.length}
          tone={trips.length > 0 ? 'danger' : 'neutral'}
          icon={<AlertTriangle size={18} />}
          hint={trips.length > 0 ? `${pendientesCount} pendientes / ${rechazadosCount} rechazos` : 'Sin comisiones pendientes'}
        />
        <StatCard
          label="Rechazos Confirmados"
          value={rechazadosCount}
          tone={rechazadosCount > 0 ? 'danger' : 'neutral'}
          icon={<Clock size={18} />}
          hint="Chofer no disponible para el viaje"
        />
        <StatCard
          label="Choferes Habilitados"
          value={availableDriversCount}
          tone="ok"
          icon={<UserCheck size={18} />}
          hint={`${drivers.length} choferes en nómina`}
        />
        <StatCard
          label="Vehículos Listos"
          value={availableVehiclesCount}
          tone="info"
          icon={<Truck size={18} />}
          hint={`${vehicles.length} vehículos en inventario`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Directorio de Choferes"
          description="Consulte puntuaciones, estado de licencias y disponibilidad en tiempo real."
          icon={<Users size={20} />}
          href="/app/secretaria/flota/conductores"
        />
        <ResourceCard
          title="Flota Vehicular"
          description="Inspeccione unidades operativas, kilometraje y mantenimientos programados."
          icon={<Car size={20} />}
          href="/app/secretaria/flota/vehiculos"
        />
        <ResourceCard
          title="Agenda de Comisiones"
          description="Visualice el calendario institucional y la programación completa de salidas."
          icon={<CalendarCheck size={20} />}
          href="/app/secretaria/agenda"
        />
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-mono flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-mono flex items-center gap-2" role="alert">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="module-panel flex flex-col items-center justify-center py-16">
          <span className="spinner w-9 h-9 mb-3" />
          <p className="ops-muted font-mono text-xs">Cargando viajes por reasignar…</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="module-panel flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
          <p className="text-base font-semibold text-zinc-900">
            No hay viajes por reasignar.
          </p>
          <p className="ops-muted text-sm mt-1">
            Todos los conductores han aceptado sus asignaciones o no existen alertas activas.
          </p>
        </div>
      ) : (
        trips.map((t) => {
          const current = form[t.id] || { driver_id: '', vehicle_id: '' };
          const canSubmit = Boolean(current.driver_id);
          const isRejected = t.driver_response === 'rechazado';
          return (
            <div key={t.id} className="module-panel shadow-sm border border-zinc-200 rounded-xl p-5 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-zinc-100 pb-3">
                <h2 className="text-lg font-bold font-mono text-zinc-900 m-0">
                  #{t.id} · {t.request?.destination || 'Sin destino'}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-full ${
                    isRejected
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {labelOf(DRIVER_RESPONSE_LABEL, t.driver_response)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="ops-muted text-xs font-mono block">Origen</span>
                  <p className="text-sm font-semibold text-zinc-800 m-0 mt-0.5">
                    {t.request?.origin || '—'}
                  </p>
                </div>
                <div>
                  <span className="ops-muted text-xs font-mono block">Salida</span>
                  <p className="text-sm font-semibold text-zinc-800 m-0 mt-0.5">
                    {formatDateReadable(t.request?.departure_date)}
                  </p>
                </div>
                <div>
                  <span className="ops-muted text-xs font-mono block">Conductor actual</span>
                  <p className="text-sm font-semibold text-zinc-800 m-0 mt-0.5">
                    {t.driver?.user?.first_name || ''} {t.driver?.user?.last_name || ''}
                  </p>
                </div>
                <div>
                  <span className="ops-muted text-xs font-mono block">Vehículo actual</span>
                  <p className="text-sm font-semibold text-zinc-800 m-0 mt-0.5">
                    {t.vehicle?.plate || '—'}
                  </p>
                </div>
              </div>

              {t.driver_reject_reason && (
                <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-lg text-xs font-mono text-rose-800 mb-4">
                  <strong>Motivo del rechazo:</strong> {t.driver_reject_reason}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-3 pt-2">
                <label className="flex-1 min-w-[220px]">
                  <span className="text-xs font-mono font-semibold text-zinc-700 block mb-1">
                    Nuevo conductor *
                  </span>
                  <select
                    className="form-select w-full"
                    value={current.driver_id}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        [t.id]: { ...current, driver_id: e.target.value },
                      }))
                    }
                  >
                    <option value="">Seleccione conductor…</option>
                    {drivers.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                        disabled={!d.is_selectable}
                      >
                        {d.name ||
                          `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim()}
                        {!d.is_selectable ? ` — ${d.status_details}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-1 min-w-[220px]">
                  <span className="text-xs font-mono font-semibold text-zinc-700 block mb-1">
                    Nuevo vehículo (opcional)
                  </span>
                  <select
                    className="form-select w-full"
                    value={current.vehicle_id}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        [t.id]: { ...current, vehicle_id: e.target.value },
                      }))
                    }
                  >
                    <option value="">Mantener actual</option>
                    {vehicles.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={!v.is_selectable}
                      >
                        {v.plate} — {v.brand} {v.model}
                        {!v.is_selectable ? ' (no disponible)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary h-[42px] px-6 text-xs font-mono uppercase tracking-wider"
                  disabled={!canSubmit || savingId === t.id}
                  onClick={() => void submit(t.id)}
                >
                  {savingId === t.id ? 'Reasignando…' : 'Reasignar'}
                </button>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
