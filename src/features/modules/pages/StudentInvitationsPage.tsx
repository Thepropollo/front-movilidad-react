import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { modulesApi } from '../api';

const INVITATION_STATUS_LABEL: Record<string, string> = {
  invitado: 'Pendiente de respuesta',
  aceptado: 'Aceptada',
  rechazado: 'Rechazada',
};

export default function StudentInvitationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [reason, setReason] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await modulesApi.myInvitations();
      setRows(data || []);
    } catch {
      setError('No se pudieron cargar invitaciones. Intente actualizar nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    if (action === 'reject' && !reason[id]?.trim()) {
      setError('Escriba un motivo antes de rechazar la invitación.');
      return;
    }

    setMsg(null);
    setError(null);
    setProcessingId(id);
    try {
      const { data } = await modulesApi.respondInvitation(id, {
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

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis viajes</p>
        <h1>Invitaciones</h1>
        <div className="module-header-actions">
          <p className="module-lead">
            Confirme o rechace su participación académica.
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
      {msg && <div className="alert alert-info" role="status">{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading ? (
        <div className="module-panel module-state" role="status">
          <span className="spinner" aria-hidden />
          <p>Cargando invitaciones…</p>
        </div>
      ) : error && rows.length === 0 ? (
        <div className="module-panel module-state" role="alert">
          <strong>No se pudieron cargar las invitaciones</strong>
          <p>Use «Actualizar» para intentarlo nuevamente.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="module-panel module-state" role="status">
          <strong>No tienes invitaciones pendientes</strong>
          <p>Cuando te asignen a un viaje aparecerá aquí.</p>
        </div>
      ) : (
        <ul className="ops-list">
        {rows.map((r) => (
          <li key={r.id} className="ops-item">
            <div>
              <strong>{r.request?.destination}</strong>
              <p>
                Docente: {r.request?.requester?.first_name}{' '}
                {r.request?.requester?.last_name}
              </p>
              <p className="ops-muted">
                Estado: {INVITATION_STATUS_LABEL[r.invitation_status] ?? r.invitation_status} · Solicitud:{' '}
                {r.request?.status}
              </p>
              {r.invitation_status === 'invitado' && (
                <>
                  <label className="form-label" htmlFor={`invitation-reason-${r.id}`}>
                    Motivo si rechaza
                  </label>
                  <textarea
                    id={`invitation-reason-${r.id}`}
                    className="form-input"
                    rows={2}
                    placeholder="Explique brevemente el motivo"
                    value={reason[r.id] || ''}
                    onChange={(e) =>
                      setReason((s) => ({ ...s, [r.id]: e.target.value }))
                    }
                  />
                </>
              )}
            </div>
            {r.invitation_status === 'invitado' && (
              <div className="ops-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={processingId !== null}
                  onClick={() => void respond(r.id, 'accept')}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={processingId !== null}
                  onClick={() => void respond(r.id, 'reject')}
                >
                  Rechazar
                </button>
              </div>
            )}
          </li>
        ))}
        </ul>
      )}
    </section>
  );
}
