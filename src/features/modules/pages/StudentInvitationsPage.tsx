import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

export default function StudentInvitationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [reason, setReason] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await modulesApi.myInvitations();
    setRows(data || []);
  };

  useEffect(() => {
    void load().catch(() => setError('No se pudieron cargar invitaciones.'));
  }, []);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    try {
      const { data } = await modulesApi.respondInvitation(id, {
        action,
        reason: reason[id],
      });
      setMsg(data.message);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al responder.');
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis viajes</p>
        <h1>Invitaciones</h1>
        <p className="module-lead">
          Confirme o rechace su participación académica.
        </p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
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
                Estado invitación: {r.invitation_status} · Solicitud:{' '}
                {r.request?.status}
              </p>
              {r.invitation_status === 'invitado' && (
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Motivo si rechaza"
                  value={reason[r.id] || ''}
                  onChange={(e) =>
                    setReason((s) => ({ ...s, [r.id]: e.target.value }))
                  }
                />
              )}
            </div>
            {r.invitation_status === 'invitado' && (
              <div className="ops-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void respond(r.id, 'accept')}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void respond(r.id, 'reject')}
                >
                  Rechazar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
