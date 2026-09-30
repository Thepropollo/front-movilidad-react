import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  AlertTriangle,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react';
import api from '@/services/api';
import { downloadApiFile } from '@/services/download';
import { REQUEST_STATUS_LABEL, labelOf } from '@/lib/labels';
import type { RoleId } from '@/config/roles';
import { useAlerts } from '@/context/AlertsContext';
import ProcessPhaseLine, {
  type ProcessPhase,
} from './ProcessPhaseLine';

type Kpi = {
  key: string;
  label: string;
  value: number | string;
  tone?: 'ok' | 'warn' | 'danger' | 'info';
  href?: string;
  hint?: string;
};

type QueueItem = {
  id: string;
  title: string;
  count: number;
  href: string;
  description: string;
};

type Chart = {
  id: string;
  title: string;
  items: Array<{ label: string; value: number }>;
};

type DashData = {
  title: string;
  subtitle: string;
  period: string;
  kpis: Kpi[];
  queue: QueueItem[];
  charts: Chart[];
  recent: Array<{
    id: number;
    label: string;
    meta: string;
    href: string;
    status?: string;
    phases?: ProcessPhase[];
  }>;
  exports: Array<{ label: string; kind: string; href: string }>;
};

function chartLabel(raw: string): string {
  return labelOf(REQUEST_STATUS_LABEL, raw);
}

async function downloadReportPdf(kind: string) {
  await downloadApiFile(`/reportes/${kind}`, `${kind}.pdf`, { format: 'pdf' });
}

function barTone(label: string): string {
  const raw = label.toLowerCase();
  if (raw.includes('rechaz')) return 'danger';
  if (raw.includes('pendiente') || raw.includes('tramite') || raw.includes('48'))
    return 'warn';
  if (raw.includes('aprob') || raw.includes('autoriz') || raw.includes('ok'))
    return 'ok';
  if (raw.includes('extern')) return 'violet';
  return 'info';
}

function ChartBlock({ chart }: { chart: Chart }) {
  const localMax = Math.max(1, ...chart.items.map((i) => i.value));
  return (
    <div className="ops-bars">
      {chart.items.length === 0 && (
        <p className="ops-muted">Sin datos aún.</p>
      )}
      {chart.items.map((item) => (
        <div key={item.label} className="ops-bar-row">
          <span title={item.label}>{chartLabel(item.label)}</span>
          <div className="ops-bar-track">
            <div
              className={`ops-bar-fill is-${barTone(item.label)}`}
              style={{
                width: `${Math.max(6, (item.value / localMax) * 100)}%`,
              }}
            />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function OperationalDashboard({
  focusRole,
}: {
  focusRole?: RoleId;
}) {
  const { alerts, unreadCount, markRead, refresh } = useAlerts();
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get('/dashboard/metrics', {
        params: focusRole ? { focus: focusRole } : undefined,
      });
      setData(res);
      refresh();
    } catch {
      setError('No se pudo cargar el tablero operativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [focusRole]);

  if (loading && !data) {
    return (
      <p className="ops-muted" role="status">
        Cargando estado de la operación…
      </p>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'Sin datos del tablero.'}
      </div>
    );
  }

  const kpis = data.kpis.slice(0, 4);
  const mainChart = data.charts[0];
  const extraCharts = data.charts.slice(1);
  const recent = data.recent.slice(0, 5);
  const mainExports = data.exports.slice(0, 2);
  const extraExports = data.exports.slice(2);
  const pendingAlerts = alerts.filter((a) => !a.read).slice(0, 4);

  return (
    <div className="ops-dashboard">
      <div className="ops-dashboard-head">
        <div>
          <p className="module-kicker">Estado · {data.period}</p>
          <h2>{data.title}</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void load()}
          aria-label="Actualizar tablero"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {pendingAlerts.length > 0 && (
        <section className="ops-alert-strip" aria-label="Pendientes de atención">
          <header>
            <AlertTriangle size={16} />
            <strong>
              {unreadCount} aviso{unreadCount === 1 ? '' : 's'} pendiente
              {unreadCount === 1 ? '' : 's'}
            </strong>
          </header>
          <ul>
            {pendingAlerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  to={alert.route || '#'}
                  className={`ops-alert-chip is-${alert.severity}`}
                  onClick={() => void markRead(alert.id)}
                >
                  <span>{alert.title}</span>
                  <em>{alert.message}</em>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pdfError && (
        <div className="alert alert-danger" role="alert">
          {pdfError}
        </div>
      )}

      <div className="ops-kpi-grid">
        {kpis.map((kpi) => (
          <Link
            key={kpi.key}
            to={kpi.href || '#'}
            className={`ops-kpi tone-${kpi.tone || 'info'}`}
          >
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            {kpi.hint && <em>{kpi.hint}</em>}
          </Link>
        ))}
      </div>

      <div className="ops-board">
        <section className="ops-widget ops-queue">
          <h3 className="ops-widget-head">Qué hacer ahora</h3>
          <div className="ops-widget-body">
            {data.queue.length === 0 ? (
              <p className="ops-muted">
                No hay pendientes. El flujo está al día.
              </p>
            ) : (
              <ul>
                {data.queue.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link to={item.href}>
                      <span className="ops-queue-count">{item.count}</span>
                      <span>
                        <strong>{item.title}</strong>
                        <em>{item.description}</em>
                      </span>
                      <ArrowUpRight size={16} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {mainChart && (
          <section className="ops-widget">
            <h3 className="ops-widget-head">{mainChart.title}</h3>
            <div className="ops-widget-body">
              <ChartBlock chart={mainChart} />
            </div>
          </section>
        )}
      </div>

      <div className="ops-side-grid">
        <section className="ops-widget">
          <h3 className="ops-widget-head">Trazabilidad reciente</h3>
          <div className="ops-widget-body">
            {recent.length === 0 ? (
              <p className="ops-muted">
                Aún no hay trámites. Al registrar uno, aparece aquí el estado.
              </p>
            ) : (
              <ul className="ops-recent">
                {recent.map((row) => (
                  <li key={row.id}>
                    <Link to={row.href}>
                      <strong>{row.label}</strong>
                      <span>{chartLabel(row.meta)}</span>
                    </Link>
                    {row.phases && row.phases.length > 0 && (
                      <ProcessPhaseLine phases={row.phases} compact />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {mainExports.length > 0 && (
          <section className="ops-widget">
            <h3 className="ops-widget-head">Reportes y PDF</h3>
            <div className="ops-widget-body">
              <p className="ops-muted">
                Respaldo digital para archivo y toma de decisiones.
              </p>
              <div className="ops-export-list">
                {mainExports.map((item) =>
                  item.kind === 'documentos' ? (
                    <Link
                      key={item.label}
                      className="btn btn-outline"
                      to={item.href}
                    >
                      <FileText size={16} /> {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setPdfError(null);
                        void downloadReportPdf(item.kind).catch(() =>
                          setPdfError(
                            `No se pudo generar el PDF de ${item.label}.`
                          )
                        );
                      }}
                    >
                      <Download size={16} /> {item.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {(extraCharts.length > 0 || extraExports.length > 0) && (
        <details className="ops-more">
          <summary>Más indicadores del periodo</summary>
          {extraCharts.length > 0 && (
            <div className="ops-chart-grid">
              {extraCharts.map((chart) => (
                <section key={chart.id} className="ops-widget">
                  <h3 className="ops-widget-head">{chart.title}</h3>
                  <div className="ops-widget-body">
                    <ChartBlock chart={chart} />
                  </div>
                </section>
              ))}
            </div>
          )}
          {extraExports.length > 0 && (
            <div className="ops-export-list ops-more-exports">
              {extraExports.map((item) =>
                item.kind === 'documentos' ? (
                  <Link
                    key={item.label}
                    className="btn btn-outline"
                    to={item.href}
                  >
                    <FileText size={16} /> {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setPdfError(null);
                      void downloadReportPdf(item.kind).catch(() =>
                        setPdfError(
                          `No se pudo generar el PDF de ${item.label}.`
                        )
                      );
                    }}
                  >
                    <Download size={16} /> {item.label}
                  </button>
                )
              )}
            </div>
          )}
        </details>
      )}
    </div>
  );
}
