import { useMemo, useState } from 'react';
import { Download, FileBarChart2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

type ReportKind = 'solicitudes' | 'viajes' | 'flota';

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
    }
    if (roleIds.includes('secretaria')) {
      items.push({ id: 'flota', label: 'Estado de flota' });
    }
    return items;
  }, [roleIds]);

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

  const downloadCsv = async () => {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({
      format: 'csv',
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(status ? { status } : {}),
    });
    const base = (api.defaults.baseURL || 'http://localhost:8000/api').replace(
      /\/$/,
      ''
    );
    const res = await fetch(`${base}/reportes/${kind}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError('No se pudo descargar el CSV.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = data?.rows || [];

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Inteligencia operativa</p>
        <h1>Reportes</h1>
        <p className="module-lead">
          Genere reportes filtrados según su rol. Exportables a CSV para Excel o
          auditoría.
        </p>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

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
              placeholder="ej. aprobada"
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
          {loading ? 'Generando…' : 'Generar'}
        </button>
        <button
          type="button"
          className="btn btn-uleam-sso"
          onClick={() => void downloadCsv()}
          disabled={!data}
        >
          <Download size={16} aria-hidden /> CSV
        </button>
      </div>

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
          <div className="stat-card">
            <span>Generado</span>
            <strong>
              {String(data.generated_at).replace('T', ' ').slice(0, 19)}
            </strong>
          </div>
        </div>
      )}

      <div className="module-panel" style={{ overflowX: 'auto' }}>
        {rows.length === 0 ? (
          <p className="ops-muted">Genere un reporte para ver resultados.</p>
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
