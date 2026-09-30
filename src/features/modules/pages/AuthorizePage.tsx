import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  FileCheck2,
  FileText,
  Navigation,
  Plane,
  AlertCircle,
} from 'lucide-react';
import { formatDateTimeReadable } from '@/lib/datetime';
import { MOBILIZATION_TYPE_LABEL, labelOf } from '@/lib/labels';
import { modulesApi } from '../api';
import { useAlerts } from '@/context/AlertsContext';
import ProcessPhaseLine, {
  type ProcessPhase,
} from '@/features/shared/ProcessPhaseLine';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

type Solicitud = {
  id: number;
  destination: string;
  mobilization_type: string;
  status: string;
  departure_date: string;
  travel_reason: string;
  phases?: ProcessPhase[];
  requester?: {
    first_name: string;
    last_name: string;
    faculty_institution: string;
  };
};

export default function AuthorizePage() {
  const { refresh } = useAlerts();
  const [rows, setRows] = useState<Solicitud[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observation, setObservation] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await modulesApi.listSolicitudes({
        status: 'pendiente_secretaria',
      });
      setRows(data);
    } catch {
      setError('No se pudo cargar la bandeja. Intente actualizar nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    modulesApi
      .listSolicitudes({ status: 'pendiente_secretaria' })
      .then(({ data }) => {
        if (!ignore) setRows(data);
      })
      .catch(() => {
        if (!ignore) setError('No se pudo cargar la bandeja. Intente actualizar nuevamente.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const act = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !observation[id]?.trim()) {
      setError('Escriba una observación antes de rechazar la solicitud.');
      return;
    }

    setMsg(null);
    setError(null);
    setProcessingId(id);
    try {
      const { data } = await modulesApi.authorize(id, {
        action,
        observation: observation[id],
      });
      setMsg(data.message);
      await load();
      refresh();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo procesar.');
    } finally {
      setProcessingId(null);
    }
  };

  const internasCount = rows.filter((r) => r.mobilization_type === 'interna').length;
  const externasCount = rows.filter((r) => r.mobilization_type === 'externa').length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Secretaría General"
        badgeVariant="indigo"
        title="Bandeja de Autorización de Solicitudes"
        description="Revisión y validación oficial de comisiones institucionales. Las solicitudes internas quedan listas para asignación vehicular; las externas pasan a Vicerrectorado/Rectorado."
        metricValue={String(rows.length)}
        metricLabel="SOLICITUDES PENDIENTES"
        actionLabel="Actualizar Bandeja"
        onAction={() => void load()}
        actionLoading={loading}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total por Revisar"
          value={rows.length}
          tone={rows.length > 0 ? 'warn' : 'ok'}
          icon={<FileCheck2 size={18} />}
          hint={rows.length > 0 ? 'En espera de dictamen oficial' : 'Bandeja al día'}
        />
        <StatCard
          label="Movilización Interna"
          value={internasCount}
          tone="info"
          icon={<Car size={18} />}
          hint="Pasan directo a asignación de flota"
        />
        <StatCard
          label="Comisiones Externas"
          value={externasCount}
          tone={externasCount > 0 ? 'warn' : 'neutral'}
          icon={<Plane size={18} />}
          hint="Requieren aval de Vicerrectorado"
        />
        <StatCard
          label="Estado Bandeja"
          value={rows.length === 0 ? 'AL DÍA' : 'ACTIVA'}
          tone={rows.length === 0 ? 'ok' : 'neutral'}
          icon={<CalendarDays size={18} />}
          hint={rows.length === 0 ? 'Sin trámites rezagados' : 'Trámites en cola'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Asignación y Despacho"
          description="Asigne conductor y vehículo a solicitudes previamente aprobadas."
          icon={<Navigation size={20} />}
          href="/app/secretaria/asignar"
        />
        <ResourceCard
          title="Agenda Institucional"
          description="Consulte el cronograma de viajes programados y disponibilidad."
          icon={<CalendarDays size={20} />}
          href="/app/secretaria/agenda"
        />
        <ResourceCard
          title="Trazabilidad de solicitudes"
          description="Consulte las etapas y responsables de cada trámite."
          icon={<FileText size={20} />}
          href="/app/secretaria/flujo"
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
            <p className="ops-muted font-mono text-xs">Cargando solicitudes pendientes…</p>
          </div>
        ) : error && rows.length === 0 ? (
          <div className="module-state text-center py-12" role="alert">
            <strong className="text-zinc-900 block mb-1">No se pudo cargar la bandeja</strong>
            <p className="ops-muted text-xs font-mono">Use «Actualizar Bandeja» para intentarlo nuevamente.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="module-state text-center py-12" role="status">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            <strong className="text-zinc-900 text-base block">No hay solicitudes pendientes</strong>
            <p className="ops-muted text-xs font-mono mt-1">La bandeja de Secretaría General está completamente al día.</p>
          </div>
        ) : (
          <ul className="ops-list divide-y divide-zinc-100">
            {rows.map((r) => (
              <li key={r.id} className="ops-item py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-base text-zinc-900">
                      #{r.id} · {r.destination}
                    </strong>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      r.mobilization_type === 'externa'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {labelOf(MOBILIZATION_TYPE_LABEL, r.mobilization_type)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 font-mono">
                    Solicitante: <span className="font-semibold text-zinc-800">{r.requester?.first_name} {r.requester?.last_name}</span> ·{' '}
                    Salida: <span className="font-semibold text-zinc-800">{formatDateTimeReadable(r.departure_date)}</span>
                  </p>
                  <p className="ops-muted text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                    <span className="font-semibold text-zinc-700">Motivo:</span> {r.travel_reason}
                  </p>
                  {r.phases && r.phases.length > 0 && (
                    <div className="pt-1">
                      <ProcessPhaseLine phases={r.phases} compact />
                    </div>
                  )}
                  <div className="pt-1">
                    <label className="text-xs font-mono font-semibold text-zinc-700 block mb-1" htmlFor={`obs-${r.id}`}>
                      Observación / Justificación (obligatorio si rechaza):
                    </label>
                    <textarea
                      id={`obs-${r.id}`}
                      className="form-input text-xs font-mono w-full"
                      rows={2}
                      placeholder="Ingrese comentarios sobre la ruta, pertinencia institucional o motivo de rechazo..."
                      value={observation[r.id] || ''}
                      onChange={(e) =>
                        setObservation((s) => ({ ...s, [r.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="ops-actions flex lg:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    className="btn btn-primary text-xs font-mono uppercase tracking-wider px-5 py-2.5"
                    disabled={processingId !== null}
                    onClick={() => void act(r.id, 'approve')}
                  >
                    {processingId === r.id ? 'Procesando…' : 'Autorizar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger text-xs font-mono uppercase tracking-wider px-5 py-2.5"
                    disabled={processingId !== null}
                    onClick={() => void act(r.id, 'reject')}
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
