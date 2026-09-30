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
import MetricProgressCard from '@/components/MetricProgressCard';
import ResourceCard from '@/components/ResourceCard';

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

  const reload = async () => {
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
    let ignore = false;
    api
      .get('/dashboard/metrics', {
        params: focusRole ? { focus: focusRole } : undefined,
      })
      .then(({ data: res }) => {
        if (!ignore) {
          setData(res);
          setError(null);
          refresh();
        }
      })
      .catch(() => {
        if (!ignore) setError('No se pudo cargar el tablero operativo.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [focusRole, refresh]);

  if (loading && !data) {
    return (
      <div className="ops-state-card" role="status" aria-live="polite">
        <RefreshCw size={22} className="ops-spin" aria-hidden />
        <div>
          <strong>Cargando estado de la operación…</strong>
          <p className="ops-muted">Sincronizando métricas y actividades en tiempo real.</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="ops-state-card is-error" role="status">
        <AlertTriangle size={24} className="ops-state-icon" aria-hidden />
        <div className="ops-state-content">
          <strong>Tablero operativo no sincronizado</strong>
          <p className="ops-muted">
            {error || 'No fue posible obtener los datos de la operación en este momento.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void reload()}
        >
          <RefreshCw size={15} aria-hidden /> Reintentar
        </button>
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
          onClick={() => void reload()}
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

      {/* 1. Modern KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-2">
        {kpis.map((kpi) => (
          <Link
            key={kpi.key}
            to={kpi.href || '#'}
            className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs hover:border-zinc-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 text-inherit no-underline"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {kpi.label}
              </span>
              <ArrowUpRight
                size={14}
                className="text-zinc-400 group-hover:text-zinc-900 transition-colors"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
                {kpi.value}
              </strong>
              {kpi.hint && (
                <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[140px]">
                  {kpi.hint}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 2. Main Board Grid: MetricProgressCard (Image 0) + Charts & Pending Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Metric Progress Card */}
        <div className="lg:col-span-1">
          <MetricProgressCard
            title="Progreso Diario"
            subtitle="Operaciones & Flota"
            metrics={[
              {
                label: 'Salidas',
                value: kpis[0]?.value ? String(kpis[0].value) : '12',
                unit: 'viajes',
                percent: 85,
                color: '#f43f5e',
              },
              {
                label: 'En Ruta',
                value: kpis[1]?.value ? String(kpis[1].value) : '8',
                unit: 'uds',
                percent: 70,
                color: '#10b981',
              },
              {
                label: 'Flota',
                value: kpis[2]?.value ? String(kpis[2].value) : '24',
                unit: 'disp',
                percent: 83,
                color: '#3b82f6',
              },
            ]}
            goalsTitle="Metas Operativas"
            goals={
              data.queue.length > 0
                ? data.queue.slice(0, 3).map((item) => ({
                    id: item.id,
                    text: `${item.title}: ${item.count}`,
                    completed: item.count === 0,
                    onClick: () => {
                      if (item.href) window.location.href = item.href;
                    },
                  }))
                : [
                    { id: '1', text: 'Inspección técnica matutina', completed: true },
                    { id: '2', text: 'Despacho de combustible verificado', completed: false },
                    { id: '3', text: 'Asignaciones de ruta al día', completed: true },
                  ]
            }
            footerText="Ver agenda y salidas de campo"
            footerHref="/app/secretaria/agenda"
          />
        </div>

        {/* Charts & Queue Column */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="ops-board" style={{ margin: 0 }}>
            <section className="ops-widget ops-queue">
              <h3 className="ops-widget-head font-mono">Qué hacer ahora</h3>
              <div className="ops-widget-body">
                {data.queue.length === 0 ? (
                  <p className="ops-muted font-mono text-xs">
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
                <h3 className="ops-widget-head font-mono">{mainChart.title}</h3>
                <div className="ops-widget-body">
                  <ChartBlock chart={mainChart} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <div className="ops-side-grid mt-4">
        <section className="ops-widget">
          <h3 className="ops-widget-head font-mono">Trazabilidad reciente</h3>
          <div className="ops-widget-body">
            {recent.length === 0 ? (
              <p className="ops-muted font-mono text-xs">
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
            <h3 className="ops-widget-head font-mono">Formatos y Reportes Descargables</h3>
            <div className="ops-widget-body flex flex-col gap-3">
              <p className="ops-muted font-mono text-xs">
                Respaldo digital oficial para archivo y toma de decisiones.
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {mainExports.map((item) => (
                  <ResourceCard
                    key={item.label}
                    title={item.label}
                    subtitle="Documento oficial ULEAM descargable en PDF"
                    icon={<FileText size={18} />}
                    badge="PDF"
                    onClick={() => {
                      if (item.kind === 'documentos') {
                        window.location.href = item.href;
                      } else {
                        setPdfError(null);
                        void downloadReportPdf(item.kind).catch(() =>
                          setPdfError(`No se pudo generar el PDF de ${item.label}.`)
                        );
                      }
                    }}
                  />
                ))}
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
