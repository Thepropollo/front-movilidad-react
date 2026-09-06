import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Star,
  UserRound,
} from 'lucide-react';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { formatDateTimeReadable } from '@/lib/datetime';
import { fetchPendingEvaluations, submitEvaluation, type RouteSheetSummary } from '../api/postTrip';

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
  const { user } = useAuth();
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
    void load();
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
      setMsg(data?.message || 'Calificación registrada.');
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
    <section className="module-page evaluation-page">
      <header className="module-header">
        <p className="module-kicker">Después del viaje</p>
        <div className="module-header-actions">
          <div>
            <h1>Calificar viaje</h1>
            <p className="module-lead">
              Cuéntenos cómo fue el servicio. La evaluación ayuda a mejorar la
              seguridad y el estado de la flota.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline module-refresh"
            onClick={() => void load()}
            disabled={loading || submitting}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden />
            Actualizar
          </button>
        </div>
      </header>

      {msg && <div className="alert alert-success" role="status"><CheckCircle2 size={18} aria-hidden />{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {loading ? (
        <div className="module-panel module-state" role="status">
          <span className="spinner" aria-hidden />
          <p>Buscando viajes pendientes de evaluación…</p>
        </div>
      ) : error && rows.length === 0 ? (
        <div className="module-panel module-state" role="alert">
          <strong>No se pudo cargar la bandeja</strong>
          <p>Use «Actualizar» para intentarlo nuevamente.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="module-panel module-state evaluation-empty" role="status">
          <CheckCircle2 size={30} aria-hidden />
          <strong>No tienes viajes pendientes por calificar</strong>
          <p>Las evaluaciones aparecen después de finalizar un viaje.</p>
        </div>
      ) : (
        <>
          <div className="module-panel evaluation-selector">
            <div>
              <label className="form-label" htmlFor="trip-eval">
                Viaje pendiente
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
            <span className="evaluation-count">{rows.length} pendiente{rows.length === 1 ? '' : 's'}</span>
          </div>

          {selected && (
            <form className="module-panel evaluation-form" onSubmit={(event) => void handleSubmit(event)}>
              <div className="evaluation-trip-summary">
                <div>
                  <p className="module-kicker">Hoja de ruta #{selected.id}</p>
                  <h2>{selected.request.origin} <span aria-hidden>→</span> {selected.request.destination}</h2>
                  <p>{selected.request.travel_reason}</p>
                </div>
                <div className="evaluation-trip-meta">
                  <span><CalendarDays size={16} aria-hidden />{formatDateTimeReadable(selected.request.departure_date)}</span>
                  <span><UserRound size={16} aria-hidden />{selected.driver.user.first_name} {selected.driver.user.last_name}</span>
                  <span><CarFront size={16} aria-hidden />{selected.vehicle.brand} {selected.vehicle.model} · {selected.vehicle.plate}</span>
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
                  Comentarios o novedades <span>(opcional)</span>
                </label>
                <div className="evaluation-textarea-wrap">
                  <textarea
                    id="eval-comments"
                    className="form-input"
                    rows={4}
                    maxLength={1000}
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Cuéntenos sobre retrasos, seguridad, trato o estado del vehículo."
                    disabled={submitting}
                  />
                  <span><MessageSquare size={15} aria-hidden />{comments.length}/1000</span>
                </div>
              </div>

              <div className="evaluation-actions">
                <p>Las dos calificaciones son obligatorias.</p>
                <Button type="submit" fullWidth={false} isLoading={submitting} disabled={!driverRating || !vehicleRating}>
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
