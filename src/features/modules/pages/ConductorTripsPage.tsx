import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  Fuel,
  Navigation,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { formatDateTimeReadable } from '@/lib/datetime';
import { DRIVER_RESPONSE_LABEL, TRIP_STATUS_LABEL, labelOf } from '@/lib/labels';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

type Trip = {
  id: number;
  trip_status: string;
  driver_response: string;
  driver_reject_reason?: string | null;
  request?: { destination: string; departure_date: string; origin: string };
  vehicle?: { plate: string; brand: string; model: string };
};

export default function ConductorTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reason, setReason] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await modulesApi.myTrips();
      setTrips(data);
    } catch {
      setError('No se pudieron cargar viajes. Intente actualizar nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    modulesApi
      .myTrips()
      .then(({ data }) => {
        if (!ignore) setTrips(data);
      })
      .catch(() => {
        if (!ignore) setError('No se pudieron cargar viajes. Intente actualizar nuevamente.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    if (action === 'reject' && !reason[id]?.trim()) {
      setError('Escriba un motivo antes de rechazar el viaje.');
      return;
    }

    setMsg(null);
    setError(null);
    setProcessingId(id);
    try {
      const { data } = await modulesApi.respondTrip(id, {
        action,
        reason: reason[id],
      });
      setMsg(data.message);
      setReason((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al responder.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendientesCount = trips.filter((t) => t.driver_response === 'pendiente').length;
  const aceptadosCount = trips.filter((t) => t.driver_response === 'aceptado').length;
  const enRutaCount = trips.filter((t) => t.trip_status === 'en_ruta').length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Panel del Conductor"
        badgeVariant="indigo"
        title="Mis Asignaciones y Comisiones Institucionales"
        description="Gestione sus asignaciones de viaje emitidas por Secretaría General. Acepte o rechace comisiones oportunamente para habilitar el despacho vehicular e iniciar la navegación en ruta."
        metricValue={String(trips.length)}
        metricLabel="ASIGNACIONES TOTALES"
        actionLabel="Actualizar Asignaciones"
        onAction={() => void load()}
        actionLoading={loading || processingId !== null}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Asignaciones"
          value={trips.length}
          tone="info"
          icon={<Truck size={18} />}
          hint="Historial acumulado de viajes"
        />
        <StatCard
          label="Pendientes de Respuesta"
          value={pendientesCount}
          tone={pendientesCount > 0 ? 'warn' : 'ok'}
          icon={<Clock size={18} />}
          hint={pendientesCount > 0 ? 'Requieren su confirmación' : 'Sin asignaciones pendientes'}
        />
        <StatCard
          label="Viajes Confirmados"
          value={aceptadosCount}
          tone="ok"
          icon={<CheckCircle2 size={18} />}
          hint="Aceptados para salida"
        />
        <StatCard
          label="En Ruta Activa"
          value={enRutaCount}
          tone={enRutaCount > 0 ? 'ok' : 'neutral'}
          icon={<Navigation size={18} />}
          hint={enRutaCount > 0 ? 'Comisión en desarrollo' : 'Ninguno en circulación'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Guía de Ruta y GPS"
          description="Navegación paso a paso, captura de paradas intermedias y odómetro."
          icon={<Compass size={20} />}
          href="/app/conductor/hoja-ruta"
        />
        <ResourceCard
          title="Mi vehículo"
          description="Consulte la unidad asignada y sus datos operativos."
          icon={<FileCheck2 size={20} />}
          href="/app/conductor/vehiculo"
        />
        <ResourceCard
          title="Vales de Combustible"
          description="Código alfanumérico del vale para abastecimiento en estaciones aliadas."
          icon={<Fuel size={20} />}
          href="/app/conductor/combustible"
        />
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-mono flex items-center gap-2" role="status">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-mono flex items-center gap-2" role="alert">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="module-panel shadow-sm border border-zinc-200 rounded-xl p-5">
        {loading ? (
          <div className="module-state flex flex-col items-center justify-center py-12" role="status">
            <span className="spinner w-8 h-8 mb-3" aria-hidden />
            <p className="ops-muted font-mono text-xs">Cargando asignaciones del conductor…</p>
          </div>
        ) : error && trips.length === 0 ? (
          <div className="module-state text-center py-12" role="alert">
            <strong className="text-zinc-900 block mb-1">No se pudieron cargar las asignaciones</strong>
            <p className="ops-muted text-xs font-mono">Use «Actualizar Asignaciones» para intentarlo nuevamente.</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="module-state text-center py-12" role="status">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            <strong className="text-zinc-900 text-base block">No tienes viajes asignados</strong>
            <p className="ops-muted text-xs font-mono mt-1">Las nuevas asignaciones emitidas por Secretaría aparecerán aquí.</p>
          </div>
        ) : (
          <ul className="ops-list divide-y divide-zinc-100">
            {trips.map((t) => {
              const isPending = t.driver_response === 'pendiente';
              return (
                <li key={t.id} className="ops-item py-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-mono text-base text-zinc-900">
                        #{t.id} · {t.request?.destination || 'Sin destino'}
                      </strong>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : t.driver_response === 'aceptado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {labelOf(DRIVER_RESPONSE_LABEL, t.driver_response)}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
                        Estado: {labelOf(TRIP_STATUS_LABEL, t.trip_status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-zinc-600">
                      <p className="m-0 flex items-center gap-1.5">
                        <Navigation size={14} className="text-secondary shrink-0" />
                        <span>Ruta: <strong className="text-zinc-800">{t.request?.origin} → {t.request?.destination}</strong></span>
                      </p>
                      <p className="m-0 flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-secondary shrink-0" />
                        <span>Salida: <strong className="text-zinc-800">{formatDateTimeReadable(t.request?.departure_date)}</strong></span>
                      </p>
                      <p className="m-0 flex items-center gap-1.5">
                        <Car size={14} className="text-secondary shrink-0" />
                        <span>Vehículo: <strong className="text-zinc-800">{t.vehicle?.plate} · {t.vehicle?.brand} {t.vehicle?.model}</strong></span>
                      </p>
                    </div>

                    {isPending && (
                      <div className="pt-2">
                        <label className="text-xs font-mono font-semibold text-zinc-700 block mb-1" htmlFor={`trip-reason-${t.id}`}>
                          Motivo en caso de rechazo:
                        </label>
                        <textarea
                          id={`trip-reason-${t.id}`}
                          className="form-input text-xs font-mono w-full"
                          rows={2}
                          placeholder="Explique el motivo si no puede atender este viaje (licencia, descanso, turno)..."
                          value={reason[t.id] || ''}
                          onChange={(e) =>
                            setReason((s) => ({ ...s, [t.id]: e.target.value }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="ops-actions flex lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                      <button
                        type="button"
                        className="btn btn-primary text-xs font-mono uppercase tracking-wider px-5 py-2.5"
                        disabled={processingId !== null}
                        onClick={() => void respond(t.id, 'accept')}
                      >
                        {processingId === t.id ? 'Aceptando…' : 'Aceptar Viaje'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger text-xs font-mono uppercase tracking-wider px-5 py-2.5"
                        disabled={processingId !== null}
                        onClick={() => void respond(t.id, 'reject')}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
