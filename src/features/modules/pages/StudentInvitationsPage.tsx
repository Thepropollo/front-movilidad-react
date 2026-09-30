import { useEffect, useState } from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard } from '@/components/Cards';

interface InvitationRecord {
  id: number;
  status?: string;
  invitation_status?: string;
  rejection_reason?: string | null;
  solicitud?: {
    id: number;
    destination: string;
    travel_reason?: string;
    departure_date?: string;
    return_date?: string;
  };
  request?: {
    destination?: string;
    travel_reason?: string;
    departure_date?: string;
    return_date?: string;
    status?: string;
    requester?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

const INVITATION_STATUS_LABEL: Record<string, string> = {
  invitado: 'Pendiente de respuesta',
  aceptado: 'Aceptada',
  rechazado: 'Rechazada',
};

export default function StudentInvitationsPage() {
  const [rows, setRows] = useState<InvitationRecord[]>([]);
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
    let ignore = false;
    modulesApi
      .myInvitations()
      .then(({ data }) => {
        if (!ignore) {
          setRows(data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('No se pudieron cargar invitaciones. Intente actualizar nuevamente.');
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
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Mis Convocatorias"
        badgeVariant="indigo"
        title="Invitaciones a Comisiones Académicas"
        description="Confirme o rechace su participación en salidas institucionales para validar su asistencia en el manifiesto oficial de pasajeros."
        metricValue={String(rows.length)}
        metricLabel="TOTAL INVITACIONES"
        actionLabel="Actualizar"
        onAction={() => void load()}
        actionLoading={loading || processingId !== null}
      />

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pendientes"
          value={rows.filter((r) => r.status === 'invitado').length}
          hint="En espera de respuesta"
          icon={<Clock size={16} />}
          tone={rows.filter((r) => r.status === 'invitado').length > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Aceptadas"
          value={rows.filter((r) => r.status === 'aceptado').length}
          hint="Cupo confirmado"
          icon={<UserCheck size={16} />}
          tone="ok"
        />
        <StatCard
          label="Rechazadas"
          value={rows.filter((r) => r.status === 'rechazado').length}
          hint="Declinadas"
          icon={<UserX size={16} />}
          tone={rows.filter((r) => r.status === 'rechazado').length > 0 ? 'danger' : 'neutral'}
        />
      </div>
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
                Estado: {INVITATION_STATUS_LABEL[r.invitation_status ?? r.status ?? 'invitado'] ?? (r.invitation_status ?? r.status ?? 'invitado')} · Solicitud:{' '}
                {r.request?.status}
              </p>
              {(r.invitation_status === 'invitado' || r.status === 'invitado') && (
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
            {(r.invitation_status === 'invitado' || r.status === 'invitado') && (
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
