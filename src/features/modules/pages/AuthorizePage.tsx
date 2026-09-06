import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDateTimeReadable } from '@/lib/datetime';
import { MOBILIZATION_TYPE_LABEL, labelOf } from '@/lib/labels';
import { modulesApi } from '../api';

type Solicitud = {
  id: number;
  destination: string;
  mobilization_type: string;
  status: string;
  departure_date: string;
  travel_reason: string;
  requester?: {
    first_name: string;
    last_name: string;
    faculty_institution: string;
  };
};

export default function AuthorizePage() {
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
    void load();
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo procesar.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Solicitudes</p>
        <h1>Autorizar o rechazar</h1>
        <div className="module-header-actions">
          <p className="module-lead">
            Secretaría revisa cada solicitud. Internas quedan listas para asignar;
            externas pasan a Vicerrectorado.
          </p>
          <button
            type="button"
            className="btn btn-outline module-refresh"
            onClick={() => void load()}
            disabled={loading || processingId !== null}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden />
            Actualizar
          </button>
        </div>
      </header>
      {msg && (
        <div className="alert alert-info" role="status">
          {msg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="module-panel">
        {loading ? (
          <div className="module-state" role="status">
            <span className="spinner" aria-hidden />
            <p>Cargando solicitudes pendientes…</p>
          </div>
        ) : error && rows.length === 0 ? (
          <div className="module-state" role="alert">
            <strong>No se pudo cargar la bandeja</strong>
            <p>Use «Actualizar» para intentarlo nuevamente.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="module-state" role="status">
            <strong>No hay solicitudes pendientes</strong>
            <p>La bandeja está al día por ahora.</p>
          </div>
        ) : (
          <ul className="ops-list">
            {rows.map((r) => (
              <li key={r.id} className="ops-item">
                <div>
                  <strong>
                    #{r.id} · {r.destination}
                  </strong>
                  <p>
                    {r.requester?.first_name} {r.requester?.last_name} ·{' '}
                    {labelOf(MOBILIZATION_TYPE_LABEL, r.mobilization_type)} ·{' '}
                    {formatDateTimeReadable(r.departure_date)}
                  </p>
                  <p className="ops-muted">{r.travel_reason}</p>
                  <label className="form-label" htmlFor={`obs-${r.id}`}>
                    Observación
                  </label>
                  <textarea
                    id={`obs-${r.id}`}
                    className="form-input"
                    rows={2}
                    value={observation[r.id] || ''}
                    onChange={(e) =>
                      setObservation((s) => ({ ...s, [r.id]: e.target.value }))
                    }
                  />
                </div>
                <div className="ops-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={processingId !== null}
                    onClick={() => void act(r.id, 'approve')}
                  >
                    {processingId === r.id ? 'Procesando…' : 'Autorizar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
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
