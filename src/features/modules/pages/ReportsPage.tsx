import { useMemo, useState } from 'react';
import { Download, FileBarChart2, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { downloadApiFile } from '@/services/download';
import { REQUEST_STATUS_LABEL, labelOf } from '@/lib/labels';

type ReportKind = 'solicitudes' | 'viajes' | 'flota' | 'mensual' | 'aceite' | 'novedades';

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
  const [data, setData] = useState<any>(null);
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
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Inteligencia operativa</p>
        <h1>Reportes institucionales</h1>
        <p className="module-lead">
          Consulte en pantalla y descargue el PDF con el mismo formato ULEAM para
          archivo físico. El CSV queda para Excel.
        </p>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
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
        <div className="report-summary">
          <div className="stat-card">
            <span>Registros</span>
            <strong>{data.total}</strong>
          </div>
          {data.summary?.costo_total != null && (
            <div className="stat-card">
              <span>Costo proyectado</span>
              <strong>${Number(data.summary.costo_total).toFixed(2)}</strong>
            </div>
          )}
          {data.summary?.mantenimiento_vencido != null && (
            <div className="stat-card">
              <span>Mantenimiento vencido</span>
              <strong>{data.summary.mantenimiento_vencido}</strong>
            </div>
          )}
          {data.summary?.vencidos != null && (
            <div className="stat-card">
              <span>Aceite vencido</span>
              <strong>{data.summary.vencidos}</strong>
            </div>
          )}
          {data.summary?.km_total != null && (
            <div className="stat-card">
              <span>Km recorridos</span>
              <strong>{data.summary.km_total}</strong>
            </div>
          )}
          <div className="stat-card">
            <span>Generado</span>
            <strong>
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
