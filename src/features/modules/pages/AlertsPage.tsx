import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modulesApi } from '../api';

type Alert = {
  type: string;
  severity: string;
  title: string;
  message: string;
  route_sheet_id?: number;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void modulesApi.alerts()
      .then((res) => setAlerts(res.data.alerts || []))
      .catch(() => setError('No se pudieron cargar alertas.'));
  }, []);

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Alertas</p>
        <h1>Centro de alertas</h1>
        <p className="module-lead">Licencias, matrículas, cupos, mantenimiento y rechazos de conductor.</p>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <ul className="ops-list">
        {alerts.map((a, i) => (
          <li key={`${a.type}-${i}`} className={`ops-item severity-${a.severity}`}>
            <div>
              <strong>{a.title}</strong>
              <p>{a.message}</p>
              <span className="ops-muted">{a.type} · {a.severity}</span>
            </div>
            {a.route_sheet_id && (
              <Link className="btn btn-primary" to="/app/secretaria/reasignar">
                Reasignar
              </Link>
            )}
          </li>
        ))}
      </ul>
      {alerts.length === 0 && !error && <div className="module-panel"><p>No hay alertas activas.</p></div>}
    </section>
  );
}
