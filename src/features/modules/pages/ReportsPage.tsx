import { useMemo, useState } from 'react';
import { Download, FileBarChart2, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { downloadApiFile } from '@/services/download';
import { REQUEST_STATUS_LABEL, labelOf } from '@/lib/labels';
import HeroMetricCard from '@/components/HeroMetricCard';
import ResourceCard from '@/components/ResourceCard';

type ReportKind = 'solicitudes' | 'viajes' | 'flota' | 'mensual' | 'aceite' | 'novedades';

type ReportResponse = {
  total?: number;
  generated_at?: string;
  rows?: Array<Record<string, unknown>>;
  summary?: {
    costo_total?: number | string;
    mantenimiento_vencido?: number;
    vencidos?: number;
    km_total?: number;
    por_estado?: Record<string, number>;
  };
  headers?: Array<{ key: string; label: string }>;
};

const KIND_META: Record<ReportKind, { code: string; title: string }> = {
  solicitudes: { code: 'PST-01-RPT-SOL', title: 'Registro de solicitudes' },
  viajes: { code: 'PST-01-F-006-RPT', title: 'Hojas de ruta' },
  flota: { code: 'FLOTA-RPT', title: 'Estado de flota' },
  mensual: { code: 'PAM-04-F-007', title: 'Informe mensual de viajes' },
  aceite: { code: 'CTRL-ACEITE', title: 'Control de cambio de aceite' },
  novedades: { code: 'LIBRO-NOVEDADES', title: 'Libro de novedades' },
};

async function downloadReport(kind: ReportKind, format: 'csv' | 'pdf', params: URLSearchParams) {
  const next = Object.fromEntries(params.entries());
  await downloadApiFile(`/reportes/${kind}`, `${KIND_META[kind].code}.${format}`, {
    ...next,
    format,
  });
}

export default function ReportsPage() {
  const { roleIds } = useAuth();
  const [kind, setKind] = useState<ReportKind>('solicitudes');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const available = useMemo(() => {
    const items: Array<{ id: ReportKind; label: string }> = [
      { id: 'solicitudes', label: 'Solicitudes / movilizaciones' },
    ];
    if (roleIds.some((r) => ['secretaria', 'vicerrector'].includes(r))) {
      items.push({ id: 'viajes', label: 'Viajes / hojas de ruta' });
      items.push({ id: 'mensual', label: 'Informe mensual de viajes (PAM-04-F-007)' });
    }
    if (roleIds.some((r) => ['secretaria', 'mecanico'].includes(r))) {
      items.push({ id: 'aceite', label: 'Control de cambio de aceite' });
      items.push({ id: 'novedades', label: 'Libro de novedades' });
    }
    if (roleIds.includes('secretaria')) {
      items.push({ id: 'flota', label: 'Estado de flota' });
    }
    if (roleIds.includes('conductor') && !roleIds.includes('secretaria')) {
      items.push({ id: 'novedades', label: 'Mis novedades' });
    }
    return items;
  }, [roleIds]);

  const filterParams = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (status) params.set('status', status);
    return params;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`/reportes/${kind}`, {
        params: {
          from: from || undefined,
          to: to || undefined,
          status: status || undefined,
        },
      });
      setData(res);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (format: 'csv' | 'pdf') => {
    try {
      await downloadReport(kind, format, filterParams());
    } catch {
      setError(`No se pudo descargar el ${format.toUpperCase()} institucional.`);
    }
  };

  const rows = data?.rows || [];
  const statusSummary = data?.summary?.por_estado
    ? Object.entries(data.summary.por_estado as Record<string, number>)
    : [];
  const maxStatus = Math.max(1, ...statusSummary.map(([, n]) => Number(n)));

  return (
    <section className="module-page flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Hero Metric Banner Card (Image 2 format) */}
      <HeroMetricCard
        headline="Reportes e Indicadores Operativos"
        author="Auditoría, Trazabilidad Oficial y Descarga de Formatos ULEAM"
        tag={{
          icon: <FileBarChart2 size={13} />,
          label: `${KIND_META[kind].code} · ${KIND_META[kind].title}`,
        }}
        metricValue={data?.total ?? 'RPT'}
        metricLabel="Total Registros"
        gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
      />

      {/* Available Report Types Grid (Image 1 format) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 my-1">
        {available.map((a) => (
          <ResourceCard
            key={a.id}
            title={a.label}
            subtitle={`Formato oficial ${KIND_META[a.id]?.code || 'ULEAM'}`}
            icon={<FileText size={18} />}
            badge={kind === a.id ? 'Activo' : undefined}
            className={kind === a.id ? 'border-zinc-900 bg-zinc-50/70 ring-1 ring-zinc-900' : ''}
            onClick={() => setKind(a.id)}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-mono" role="alert">
          {error}
        </div>
      )}

      <div className="module-panel report-filters">
        <label>
          Tipo
          <select
            className="form-select"
            value={kind}
            onChange={(e) => setKind(e.target.value as ReportKind)}
          >
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input
            type="date"
            className="form-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            className="form-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        {kind === 'solicitudes' && (
          <label>
            Estado
            <input
              className="form-input"
              placeholder="ej. pendiente_secretaria"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </label>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void load()}
          disabled={loading}
        >
          <FileBarChart2 size={16} aria-hidden />{' '}
          {loading ? 'Generando…' : 'Consultar'}
        </button>
        <button
          type="button"
          className="btn btn-uleam-sso"
          onClick={() => void exportFile('pdf')}
        >
          <FileText size={16} aria-hidden /> PDF respaldo
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void exportFile('csv')}
        >
          <Download size={16} aria-hidden /> CSV
        </button>
      </div>

      <p className="ops-muted">
        Formato {KIND_META[kind].code} · {KIND_META[kind].title}
      </p>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 my-3">
          <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Registros
            </span>
            <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
              {data.total}
            </strong>
          </div>

          {data.summary?.costo_total != null && (
            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Costo proyectado
              </span>
              <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
                ${Number(data.summary.costo_total).toFixed(2)}
              </strong>
            </div>
          )}

          {data.summary?.mantenimiento_vencido != null && (
            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Mant. Vencido
              </span>
              <strong className="font-mono font-bold text-2xl text-amber-600 leading-none">
                {data.summary.mantenimiento_vencido}
              </strong>
            </div>
          )}

          {data.summary?.vencidos != null && (
            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Aceite vencido
              </span>
              <strong className="font-mono font-bold text-2xl text-rose-600 leading-none">
                {data.summary.vencidos}
              </strong>
            </div>
          )}

          {data.summary?.km_total != null && (
            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-sky-600 uppercase tracking-wider">
                Km recorridos
              </span>
              <strong className="font-mono font-bold text-2xl text-sky-600 leading-none">
                {data.summary.km_total}
              </strong>
            </div>
          )}

          <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Generado
            </span>
            <strong className="font-mono font-bold text-xs text-zinc-700 leading-tight truncate">
              {String(data.generated_at).replace('T', ' ').slice(0, 19)}
            </strong>
          </div>
        </div>
      )}

      {statusSummary.length > 0 && (
        <div className="module-panel" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>Por estado</h2>
          <div className="ops-bars">
            {statusSummary.map(([label, value]) => (
              <div key={label} className="ops-bar-row">
                <span>{labelOf(REQUEST_STATUS_LABEL, label)}</span>
                <div className="ops-bar-track">
                  <div
                    className="ops-bar-fill"
                    style={{
                      width: `${Math.max(6, (Number(value) / maxStatus) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="module-panel" style={{ overflowX: 'auto' }}>
        {rows.length === 0 ? (
          <p className="ops-muted">
            Consulte un reporte para ver resultados o descargue el PDF de respaldo.
          </p>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                {Object.keys(rows[0]).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: Record<string, unknown>, i: number) => (
                <tr key={i}>
                  {Object.keys(rows[0]).map((k) => (
                    <td key={k}>{String(r[k] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
