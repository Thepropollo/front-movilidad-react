import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { formatDateTimeReadable } from '@/lib/datetime';
import {
  fetchPendingEvaluations,
  submitEvaluation,
  type RouteSheetSummary,
} from '../api/postTrip';

export default function TripEvaluationPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RouteSheetSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [driverRating, setDriverRating] = useState<number>(0);
  const [vehicleRating, setVehicleRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingEvaluations();
      setRows(data);
      setSelectedId((prev) => (prev || data[0]?.id || ''));
    } catch {
      setError('No se pudieron cargar viajes pendientes por calificar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !user) return;
    if (driverRating < 1 || vehicleRating < 1) {
      setError('Debe calificar conductor y vehículo.');
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
        comments: comments || undefined,
      });

      setMsg(data?.message || 'Calificación registrada.');
      setDriverRating(0);
      setVehicleRating(0);
      setComments('');
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo registrar la calificación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Después del viaje</p>
        <h1>Calificar viaje</h1>
        <p className="module-lead">
          Evalúe conductor y vehículo en viajes finalizados.
        </p>
      </header>

      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="module-panel" style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="trip-eval">
          Viaje pendiente
        </label>
        <select
          id="trip-eval"
          className="form-select"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          disabled={loading || rows.length === 0}
        >
          <option value="">{loading ? 'Cargando...' : 'Seleccione...'}</option>
          {rows.map((row) => (
            <option key={row.id} value={row.id}>
              #{row.id} · {row.request.origin} → {row.request.destination}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <form className="module-panel" onSubmit={(e) => void handleSubmit(e)}>
          <p>
            <strong>Conductor:</strong> {selected.driver.user.first_name}{' '}
            {selected.driver.user.last_name}
          </p>
          <p>
            <strong>Vehículo:</strong> {selected.vehicle.brand} {selected.vehicle.model}{' '}
            ({selected.vehicle.plate})
          </p>
          <p className="ops-muted" style={{ marginBottom: 12 }}>
            {formatDateTimeReadable(selected.request.departure_date)} ·{' '}
            {formatDateTimeReadable(selected.request.return_date)}
          </p>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 12 }}>
            <div>
              <label className="form-label" htmlFor="driver-rating">
                Calificación conductor (1-5)
              </label>
              <input
                id="driver-rating"
                className="form-input"
                type="number"
                min={1}
                max={5}
                value={driverRating || ''}
                onChange={(e) => setDriverRating(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="vehicle-rating">
                Calificación vehículo (1-5)
              </label>
              <input
                id="vehicle-rating"
                className="form-input"
                type="number"
                min={1}
                max={5}
                value={vehicleRating || ''}
                onChange={(e) => setVehicleRating(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <label className="form-label" htmlFor="eval-comments">
            Comentarios (opcional)
          </label>
          <textarea
            id="eval-comments"
            className="form-input"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Escriba observaciones del servicio."
            style={{ marginBottom: 12, paddingLeft: '16px' }}
          />

          <Button type="submit" fullWidth={false} isLoading={submitting}>
            Guardar calificación
          </Button>
        </form>
      )}

      {!loading && rows.length === 0 && (
        <div className="module-panel">
          <p>No hay viajes pendientes por calificar.</p>
        </div>
      )}
    </section>
  );
}
