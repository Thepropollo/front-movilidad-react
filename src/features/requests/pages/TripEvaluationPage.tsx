import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  FileCheck2,
  FileText,
  MessageSquare,
  Star,
  UserRound,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { formatDateTimeReadable } from '@/lib/datetime';
import { fetchPendingEvaluations, submitEvaluation, type RouteSheetSummary } from '../api/postTrip';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

type RatingFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
};

function RatingField({ id, label, value, onChange, disabled }: RatingFieldProps) {
  return (
    <fieldset className="rating-field" disabled={disabled}>
      <legend id={`${id}-label`}>{label}</legend>
      <div className="rating-options" role="radiogroup" aria-labelledby={`${id}-label`}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} de 5 estrellas`}
            className={`rating-option${value === rating ? ' is-selected' : ''}`}
            onClick={() => onChange(rating)}
          >
            <Star size={26} aria-hidden />
            <span>{rating}</span>
          </button>
        ))}
      </div>
      <p className="rating-hint">
        {value ? `${value} de 5 · ${value <= 2 ? 'Necesita atención' : value === 3 ? 'Aceptable' : 'Buen servicio'}` : 'Seleccione una calificación'}
      </p>
    </fieldset>
  );
}

export default function TripEvaluationPage() {
  const { user, roleIds } = useAuth();
  const isStudentOnly = roleIds.includes('estudiante') && !roleIds.includes('docente');
  const personalHistoryPath = isStudentOnly ? '/app/estudiante/flujo' : '/app/docente/historial';
  const personalMapPath = isStudentOnly ? '/app/estudiante/mapa' : '/app/docente/mapa';
  const personalDocumentsPath = isStudentOnly ? '/app/estudiante/documentos' : '/app/docente/documentos';
  const [rows, setRows] = useState<RouteSheetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [driverRating, setDriverRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetRatings = () => {
    setDriverRating(0);
    setVehicleRating(0);
    setComments('');
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingEvaluations();
      setRows(data);
      setSelectedId((current) =>
        current && data.some((row) => row.id === current) ? current : data[0]?.id || ''
      );
    } catch {
      setError('No se pudieron cargar viajes pendientes por calificar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetchPendingEvaluations()
      .then((data) => {
        if (!ignore) {
          setRows(data);
          setSelectedId((current) =>
            current && data.some((row) => row.id === current) ? current : data[0]?.id || ''
          );
        }
      })
      .catch(() => {
        if (!ignore) setError('No se pudieron cargar viajes pendientes por calificar.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selected = rows.find((row) => row.id === selectedId) ?? null;

  const handleSelect = (value: string) => {
    setSelectedId(value ? Number(value) : '');
    resetRatings();
    setMsg(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !user) return;
    if (driverRating < 1 || vehicleRating < 1) {
      setError('Seleccione una calificación para el conductor y el vehículo.');
      return;
    }

    setSubmitting(true);
    setMsg(null);
    setError(null);
    try {
      const data = await submitEvaluation({
        hoja_ruta_id: selected.id,
        pasajero_id: user.id,
        calificacion_conductor: driverRating,
        calificacion_vehiculo: vehicleRating,
        comments: comments.trim() || undefined,
      });
      setMsg(data?.message || 'Calificación registrada con éxito.');
      resetRatings();
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo registrar la calificación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="module-page evaluation-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Post-Viaje y Calidad"
        badgeVariant="amber"
        title="Evaluación de Calidad y Servicio Institucional"
        description="Califique el desempeño del conductor asignado y el estado mecánico/limpieza del vehículo al concluir su comisión. Su retroalimentación contribuye a la mejora continua y seguridad de la flota universitaria."
        metricValue={String(rows.length)}
        metricLabel="VIAJES POR CALIFICAR"
        actionLabel="Actualizar Pendientes"
        onAction={() => void load()}
        actionLoading={loading || submitting}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total por Calificar"
          value={rows.length}
          tone={rows.length > 0 ? 'warn' : 'ok'}
          icon={<FileCheck2 size={18} />}
          hint={rows.length > 0 ? 'Hojas de ruta finalizadas' : 'Todas completadas'}
        />
        <StatCard
          label="Calificación Chofer"
          value={driverRating > 0 ? `${driverRating}/5 ★` : '—'}
          tone={driverRating >= 4 ? 'ok' : driverRating > 0 ? 'warn' : 'neutral'}
          icon={<Star size={18} />}
          hint={driverRating > 0 ? 'Puntuación asignada' : 'Pendiente de puntuar'}
        />
        <StatCard
          label="Calificación Vehículo"
          value={vehicleRating > 0 ? `${vehicleRating}/5 ★` : '—'}
          tone={vehicleRating >= 4 ? 'ok' : vehicleRating > 0 ? 'warn' : 'neutral'}
          icon={<CarFront size={18} />}
          hint={vehicleRating > 0 ? 'Puntuación asignada' : 'Pendiente de puntuar'}
        />
        <StatCard
          label="Estado Registro"
          value={driverRating > 0 && vehicleRating > 0 ? 'COMPLETO' : 'INCOMPLETO'}
          tone={driverRating > 0 && vehicleRating > 0 ? 'ok' : 'neutral'}
          icon={<HelpCircle size={18} />}
          hint="Requiere ambas puntuaciones"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title={isStudentOnly ? 'Mis viajes' : 'Mis solicitudes'}
          description="Consulte el estado y el historial de sus movilizaciones."
          icon={<FileText size={20} />}
          href={personalHistoryPath}
        />
        <ResourceCard
          title="Mapa de viajes"
          description="Consulte rutas, paradas y ubicación de las movilizaciones."
          icon={<CalendarDays size={20} />}
          href={personalMapPath}
        />
        <ResourceCard
          title="Documentos y Liquidación"
          description="Consultar normativa de viáticos y formatos de rendición institucional."
          icon={<FileCheck2 size={20} />}
          href={personalDocumentsPath}
        />
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-mono flex items-center gap-2" role="status">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" aria-hidden />
          <span>{msg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-mono flex items-center gap-2" role="alert">
          <AlertCircle size={18} className="text-rose-600 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="module-panel module-state flex flex-col items-center justify-center py-16" role="status">
          <span className="spinner w-8 h-8 mb-3" aria-hidden />
          <p className="font-mono text-xs text-zinc-500">Buscando viajes pendientes de evaluación…</p>
        </div>
      ) : error && rows.length === 0 ? (
        <div className="module-panel module-state text-center py-16" role="alert">
          <strong className="text-zinc-900 block mb-1">No se pudo cargar la bandeja</strong>
          <p className="ops-muted text-xs font-mono">Use «Actualizar Pendientes» para intentarlo nuevamente.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="module-panel module-state evaluation-empty text-center py-16" role="status">
          <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-3" aria-hidden />
          <strong className="text-base text-zinc-900 block">No tienes viajes pendientes por calificar</strong>
          <p className="ops-muted text-xs font-mono mt-1">Las evaluaciones aparecen automáticamente después de concluir un viaje institucional.</p>
        </div>
      ) : (
        <>
          <div className="sgv-dark-form-card p-5 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="form-label" htmlFor="trip-eval">
                Seleccionar Viaje Pendiente
              </label>
              <select
                id="trip-eval"
                className="form-select"
                value={selectedId}
                onChange={(event) => handleSelect(event.target.value)}
                disabled={submitting}
              >
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    #{row.id} · {row.request.origin} → {row.request.destination}
                  </option>
                ))}
              </select>
            </div>
            <span className="sgv-pill-capsule is-invited shrink-0">
              {rows.length} pendiente{rows.length === 1 ? '' : 's'}
            </span>
          </div>

          {selected && (
            <form className="sgv-dark-form-card evaluation-form space-y-6" onSubmit={(event) => void handleSubmit(event)}>
              <div className="sgv-dark-form-header">
                <div>
                  <span className="sgv-pill-capsule is-invited mb-2">Hoja de ruta #{selected.id}</span>
                  <h2 className="sgv-dark-form-title text-xl mt-1">
                    {selected.request.origin} <span aria-hidden>→</span> {selected.request.destination}
                  </h2>
                  <p className="sgv-dark-form-subtitle">{selected.request.travel_reason}</p>
                </div>
                <div className="evaluation-trip-meta font-mono text-xs text-slate-500 mt-3 flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-secondary" aria-hidden />{formatDateTimeReadable(selected.request.departure_date)}</span>
                  <span className="flex items-center gap-1.5"><UserRound size={14} className="text-secondary" aria-hidden />{selected.driver.user.first_name} {selected.driver.user.last_name}</span>
                  <span className="flex items-center gap-1.5"><CarFront size={14} className="text-secondary" aria-hidden />{selected.vehicle.brand} {selected.vehicle.model} · {selected.vehicle.plate}</span>
                </div>
              </div>

              <div className="evaluation-ratings">
                <RatingField
                  id="driver-rating"
                  label="¿Cómo califica al conductor?"
                  value={driverRating}
                  onChange={setDriverRating}
                  disabled={submitting}
                />
                <RatingField
                  id="vehicle-rating"
                  label="¿Cómo califica el vehículo?"
                  value={vehicleRating}
                  onChange={setVehicleRating}
                  disabled={submitting}
                />
              </div>

              <div className="evaluation-comments">
                <label className="form-label" htmlFor="eval-comments">
                  Comentarios o novedades <span className="font-mono text-slate-500 text-xs">(opcional)</span>
                </label>
                <div className="evaluation-textarea-wrap">
                  <textarea
                    id="eval-comments"
                    className="form-input"
                    rows={4}
                    maxLength={1000}
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Cuéntenos sobre retrasos, puntualidad, seguridad, trato o estado de la unidad..."
                    disabled={submitting}
                  />
                  <span className="font-mono text-xs text-slate-500"><MessageSquare size={14} aria-hidden />{comments.length}/1000</span>
                </div>
              </div>

              <div className="sgv-dark-divider flex-wrap">
                <p className="font-mono text-xs text-slate-500 mr-auto">Las dos calificaciones son obligatorias para asentar el registro.</p>
                <Button
                  type="submit"
                  variant="dark-submit"
                  fullWidth={false}
                  isLoading={submitting}
                  disabled={!driverRating || !vehicleRating}
                >
                  Enviar evaluación
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
