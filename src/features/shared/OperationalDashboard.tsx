import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  Fuel,
  RefreshCw,
  Route,
  Users,
  Wrench,
} from 'lucide-react';
import api from '@/services/api';
import { downloadApiFile } from '@/services/download';
import { REQUEST_STATUS_LABEL, labelOf } from '@/lib/labels';
import type { RoleId } from '@/config/roles';
import { useAlerts } from '@/context/AlertsContext';
import ProcessPhaseLine, { type ProcessPhase } from './ProcessPhaseLine';
import StatCard, { type StatCardTone } from '@/components/Cards/StatCard';
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

type Tone = 'ok' | 'warn' | 'danger' | 'violet' | 'info';

/* Paleta de datos fija: azul, celeste, verde, ámbar; rojo solo para lo negativo. */
const TONE_HEX: Record<Tone, string> = {
  info: '#0b63b4',
  violet: '#22a3cf',
  ok: '#26a65e',
  warn: '#e08a00',
  danger: '#dc3b3b',
};

function chartLabel(raw: string): string {
  return labelOf(REQUEST_STATUS_LABEL, raw);
}

function barTone(label: string): Tone {
  const raw = label.toLowerCase();
  if (raw.includes('rechaz') || raw.includes('vencid') || raw.includes('cancel')) return 'danger';
  if (raw.includes('pendiente') || raw.includes('tramite') || raw.includes('trámite') || raw.includes('48'))
    return 'warn';
  if (raw.includes('aprob') || raw.includes('autoriz') || raw.includes('ok') || raw.includes('complet') || raw.includes('disponible'))
    return 'ok';
  if (raw.includes('extern')) return 'violet';
  return 'info';
}

function kpiIcon(kpi: Kpi): ReactNode {
  const k = `${kpi.key} ${kpi.label}`.toLowerCase();
  if (k.includes('alert') || k.includes('aviso')) return <BellRing size={18} />;
  if (k.includes('vehic') || k.includes('flota') || k.includes('unidad')) return <Car size={18} />;
  if (k.includes('conduct') || k.includes('particip') || k.includes('estudiante')) return <Users size={18} />;
  if (k.includes('manten') || k.includes('taller') || k.includes('aceite') || k.includes('orden')) return <Wrench size={18} />;
  if (k.includes('combust') || k.includes('ticket')) return <Fuel size={18} />;
  if (k.includes('ruta') || k.includes('viaje') || k.includes('salida')) return <Route size={18} />;
  if (k.includes('pendiente') || k.includes('espera') || k.includes('48')) return <Clock3 size={18} />;
  if (k.includes('aprob') || k.includes('autoriz') || k.includes('complet')) return <CheckCircle2 size={18} />;
  if (k.includes('solicit') || k.includes('trámite') || k.includes('tramite')) return <ClipboardList size={18} />;
  return <FileText size={18} />;
}

async function downloadReportPdf(kind: string) {
  await downloadApiFile(`/reportes/${kind}`, `${kind}.pdf`, { format: 'pdf' });
}

function BarsChart({ chart }: { chart: Chart }) {
  const max = Math.max(1, ...chart.items.map((i) => i.value));
  if (chart.items.length === 0) return <p className="ops-muted">Sin datos en el periodo.</p>;
  return (
    <div className="ops-bars" role="list" aria-label={chart.title}>
      {chart.items.map((item) => {
        const tone = barTone(item.label);
        return (
          <div key={item.label} className="ops-bar-row" role="listitem">
            <span title={chartLabel(item.label)}>{chartLabel(item.label)}</span>
            <div
              className="ops-bar-track"
              role="img"
              aria-label={`${chartLabel(item.label)}: ${item.value}`}
            >
              <div
                className={`ops-bar-fill is-${tone}`}
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
            <strong>{item.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ chart }: { chart: Chart }) {
  const total = chart.items.reduce((acc, i) => acc + i.value, 0);
  if (chart.items.length === 0 || total === 0) {
    return <p className="ops-muted">Sin movimientos en el periodo.</p>;
  }

  const radius = 52;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;

  const slices = chart.items.reduce<
    Array<Chart['items'][number] & { tone: Tone; dasharray: string; dashoffset: number; pct: number }>
  >((acc, item) => {
    const consumed = acc.reduce((sum, s) => sum + (s.value / total) * circumference, 0);
    const fraction = item.value / total;
    const length = fraction * circumference;
    acc.push({
      ...item,
      tone: barTone(item.label),
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -consumed,
      pct: Math.round(fraction * 100),
    });
    return acc;
  }, []);

  const summary = slices.map((s) => `${chartLabel(s.label)} ${s.value} (${s.pct}%)`).join(', ');

  return (
    <div className="ops-donut">
      <div className="ops-donut-svg" role="img" aria-label={`${chart.title}. Total ${total}: ${summary}`}>
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <circle cx="66" cy="66" r={radius} fill="none" stroke="#eceff3" strokeWidth={stroke} />
          {slices.map((slice) => (
            <circle
              key={slice.label}
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              stroke={TONE_HEX[slice.tone]}
              strokeWidth={stroke}
              strokeDasharray={slice.dasharray}
              strokeDashoffset={slice.dashoffset}
            />
          ))}
        </svg>
        <div className="ops-donut-center">
          <strong>{total}</strong>
          <small>Total</small>
        </div>
      </div>
      <ul className="ops-legend" aria-hidden="true">
        {slices.map((slice) => (
          <li key={slice.label}>
            <i className={`is-${slice.tone}`} />
            <span>{chartLabel(slice.label)}</span>
            <strong>{slice.value}</strong>
            <em>{slice.pct}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OperationalDashboard({ focusRole }: { focusRole?: RoleId }) {
  const { alerts, unreadCount, markRead, refresh } = useAlerts();
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const fetchMetrics = useCallback(
    (signal?: { ignore: boolean }) =>
      api
        .get('/dashboard/metrics', {
          params: focusRole ? { focus: focusRole } : undefined,
        })
        .then(({ data: res }) => {
          if (signal?.ignore) return;
          setData(res);
          setError(null);
          refresh();
        })
        .catch(() => {
          if (!signal?.ignore) setError('No se pudo cargar el tablero operativo.');
        })
        .finally(() => {
          if (!signal?.ignore) setLoading(false);
        }),
    [focusRole, refresh]
  );

  const load = () => {
    setLoading(true);
    void fetchMetrics();
  };

  useEffect(() => {
    const signal = { ignore: false };
    void fetchMetrics(signal);
    return () => {
      signal.ignore = true;
    };
  }, [fetchMetrics]);

  if (loading && !data) {
    return (
      <div className="ops-state-card" role="status" aria-live="polite">
        <RefreshCw size={22} className="ops-spin" aria-hidden />
        <div>
          <strong>Cargando estado de la operación…</strong>
          <p className="ops-muted">Sincronizando métricas y pendientes.</p>
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
        <button type="button" className="btn btn-outline btn-sm" onClick={() => void load()}>
          <RefreshCw size={15} aria-hidden /> Reintentar
        </button>
      </div>
    );
  }

  const kpis = data.kpis.slice(0, 4);
  const [mainChart, ...extraCharts] = data.charts;
  const recent = data.recent.slice(0, 5);
  const [docExports, pdfExports] = [
    data.exports.filter((e) => e.kind === 'documentos'),
    data.exports.filter((e) => e.kind !== 'documentos'),
  ];
  const pendingAlerts = alerts.filter((a) => !a.read).slice(0, 4);

  return (
    <div className="ops-dashboard" aria-label={data.title}>
      <div className="sg-section-head">
        <h2>{data.title}</h2>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          Periodo: {data.period}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Actualizar tablero"
          >
            <RefreshCw size={14} className={loading ? 'ops-spin' : ''} aria-hidden />
            Actualizar
          </button>
        </span>
      </div>

      {pendingAlerts.length > 0 && (
        <section className="ops-alert-strip" aria-label="Pendientes de atención">
          <header>
            <div>
              <AlertTriangle size={17} aria-hidden />
              <strong>
                {unreadCount} aviso{unreadCount === 1 ? '' : 's'} pendiente
                {unreadCount === 1 ? '' : 's'}
              </strong>
            </div>
            <small>Al resolver el trámite, el aviso se retira solo.</small>
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

      <div className="sg-stat-grid" aria-label="Indicadores del periodo">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            tone={(kpi.tone as StatCardTone) || 'info'}
            icon={kpiIcon(kpi)}
            href={kpi.href}
          />
        ))}
      </div>

      <div className="ops-grid-2 is-wide-left">
        <section className="ops-widget ops-queue" aria-labelledby="ops-queue-title">
          <h3 className="ops-widget-head" id="ops-queue-title">
            Qué hacer ahora
            <small>{data.queue.length} frente{data.queue.length === 1 ? '' : 's'}</small>
          </h3>
          <div className="ops-widget-body">
            {data.queue.length === 0 ? (
              <p className="ops-muted">No hay pendientes. El flujo está al día.</p>
            ) : (
              <ul>
                {data.queue.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link to={item.href} className={item.count === 0 ? 'is-zero' : undefined}>
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
          <section className="ops-widget" aria-labelledby="ops-chart-main">
            <h3 className="ops-widget-head" id="ops-chart-main">
              {mainChart.title}
              <small>{data.period}</small>
            </h3>
            <div className="ops-widget-body">
              <DonutChart chart={mainChart} />
            </div>
          </section>
        )}
      </div>

      <div className="ops-grid-2 is-wide-left">
        <section className="ops-widget" aria-labelledby="ops-recent-title">
          <h3 className="ops-widget-head" id="ops-recent-title">
            Trazabilidad reciente
            <small>Fases de cada trámite</small>
          </h3>
          <div className="ops-widget-body">
            {recent.length === 0 ? (
              <p className="ops-muted">
                Aún no hay trámites. Al registrar uno, aparece aquí su estado.
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {extraCharts.slice(0, 1).map((chart) => (
            <section key={chart.id} className="ops-widget" aria-label={chart.title}>
              <h3 className="ops-widget-head">{chart.title}</h3>
              <div className="ops-widget-body">
                <BarsChart chart={chart} />
              </div>
            </section>
          ))}

          {(docExports.length > 0 || pdfExports.length > 0) && (
            <section className="ops-widget" aria-labelledby="ops-exports-title">
              <h3 className="ops-widget-head" id="ops-exports-title">
                Documentos y reportes
                <small>PDF institucional</small>
              </h3>
              <div className="ops-widget-body ops-export-list">
                {docExports.map((item) => (
                  <ResourceCard
                    key={item.label}
                    title={item.label}
                    subtitle="Órdenes y hojas de ruta emitidas"
                    icon={<FileText size={18} />}
                    href={item.href}
                  />
                ))}
                {pdfExports.map((item) => (
                  <ResourceCard
                    key={item.label}
                    title={item.label}
                    subtitle="Descargar informe del periodo"
                    icon={<Download size={18} />}
                    badge="PDF"
                    onClick={() => {
                      setPdfError(null);
                      void downloadReportPdf(item.kind).catch(() =>
                        setPdfError(`No se pudo generar el PDF de ${item.label}.`)
                      );
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {extraCharts.length > 1 && (
        <details className="ops-more">
          <summary>Más indicadores del periodo</summary>
          <div className="sg-stat-grid" style={{ marginTop: 8 }}>
            {extraCharts.slice(1).map((chart) => (
              <section key={chart.id} className="ops-widget" aria-label={chart.title}>
                <h3 className="ops-widget-head">{chart.title}</h3>
                <div className="ops-widget-body">
                  <BarsChart chart={chart} />
                </div>
              </section>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
