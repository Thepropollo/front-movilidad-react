import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modulesApi } from '../api';
import { useAuth } from '@/context/AuthContext';

type TimelineItem = {
  id: number;
  action: string;
  from_status: string | null;
  to_status: string;
  observation?: string;
  created_at?: string;
  user?: { first_name: string; last_name: string };
};

const ACTION_LABELS: Record<string, string> = {
  SOLICITUD_CREADA: 'Solicitud creada',
  SECRETARIA_AUTORIZA: 'Secretaria autoriza',
  SECRETARIA_RECHAZA: 'Secretaria rechaza',
  VICERRECTOR_APRUEBA: 'Vicerrectorado aprueba',
  VICERRECTOR_RECHAZA: 'Vicerrectorado rechaza',
  ASIGNACION_RECURSOS: 'Asignacion de recursos',
  CONDUCTOR_ACEPTA: 'Conductor acepta',
  CONDUCTOR_RECHAZA: 'Conductor rechaza',
  REASIGNACION: 'Reasignacion',
};

export default function FlujoPage() {
  const { roleIds } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Array<{ id: number; destination: string; status: string }>>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void modulesApi.listSolicitudes()
      .then((res) => setSolicitudes(res.data))
      .catch(() => setError('No se pudieron cargar solicitudes.'));
  }, []);

  const loadFlujo = async (id: number) => {
    setError(null);
    try {
      const { data } = await modulesApi.flujo(id);
      setTimeline(data.timeline || []);
      setDetail(data.request);
    } catch {
      setError('No se pudo cargar la trazabilidad.');
    }
  };

  const mapPath = roleIds.includes('secretaria')
    ? '/app/secretaria/mapa'
    : roleIds.includes('vicerrector')
      ? '/app/vicerrector/mapa'
      : roleIds.includes('docente')
        ? '/app/docente/mapa'
        : roleIds.includes('estudiante')
          ? '/app/estudiante/mapa'
          : roleIds.includes('conductor')
            ? '/app/conductor/mapa'
            : '/app/secretaria/mapa';

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Trazabilidad</p>
        <h1>Flujo completo de la solicitud</h1>
        <p className="module-lead">
          Si: el sistema guarda cada cambio de estado con usuario, fecha y observacion
          (tabla request_status_histories).
        </p>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="module-panel" style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="solicitud">Solicitud</label>
        <select
          id="solicitud"
          className="form-select"
          value={selected}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelected(id);
            if (id) void loadFlujo(id);
          }}
        >
          <option value="">Seleccione…</option>
          {solicitudes.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.id} · {s.destination} · {s.status}
            </option>
          ))}
        </select>
      </div>

      {detail && (
        <div className="trace-head">
          <div>
            <p className="module-kicker">Estado actual</p>
            <h2>{detail.status}</h2>
            <p>{detail.origin} → {detail.destination}</p>
          </div>
          {detail.route_sheet?.id && (
            <Link className="btn btn-primary" to={mapPath}>
              Ver en mapa
            </Link>
          )}
        </div>
      )}

      <ol className="timeline timeline-rich">
        {timeline.map((t, idx) => (
          <li key={t.id}>
            <span className="timeline-step">{idx + 1}</span>
            <div>
              <strong>{ACTION_LABELS[t.action] || t.action}</strong>
              <span className="ops-muted">
                {t.from_status || 'inicio'} → {t.to_status}
              </span>
              <span>
                {t.user ? `${t.user.first_name} ${t.user.last_name}` : 'Sistema'}
                {t.created_at ? ` · ${String(t.created_at).replace('T', ' ').slice(0, 16)}` : ''}
              </span>
              {t.observation && <em>{t.observation}</em>}
            </div>
          </li>
        ))}
      </ol>
      {selected && timeline.length === 0 && (
        <div className="module-panel"><p>Sin eventos registrados aun.</p></div>
      )}
    </section>
  );
}
