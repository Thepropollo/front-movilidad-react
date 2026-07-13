import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Calendar, User, ShieldAlert } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { fetchSystemLogs, type SystemLog } from '../api/admin';

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLogs = async (targetPage: number = page) => {
    try {
      setLoading(true);
      const res = await fetchSystemLogs({
        search: search || undefined,
        action: actionFilter || undefined,
        page: targetPage
      });
      setLogs(res.data);
      setPage(res.current_page);
      setTotalPages(res.last_page);
      setTotalLogs(res.total);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar logs de auditoría de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs(1);
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <ShieldCheck className="text-secondary-brand" size={28} />
            Visor de Logs y Auditoría de Seguridad
          </h1>
          <p className="text-muted mt-1">Bitácora oficial inmutable de auditoría para comisiones de servicio y movimientos del sistema.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3">
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Filter panel */}
      <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40 mb-8">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          
          <Input
            label="Buscar por Usuario"
            placeholder="Nombre, apellido o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />

          <div className="form-group">
            <label className="form-label" htmlFor="action-select-filter">Acción Realizada</label>
            <select
              id="action-select-filter"
              className="form-input"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">-- Todas las Acciones --</option>
              <option value="APROBÓ_SOLICITUD">APROBÓ_SOLICITUD</option>
              <option value="EMITIÓ_HOJA_RUTA">EMITIÓ_HOJA_RUTA</option>
              <option value="EMITIÓ_VALE_COMBUSTIBLE">EMITIÓ_VALE_COMBUSTIBLE</option>
              <option value="REGISTRÓ_INSPECCION_SALIDA">REGISTRÓ_INSPECCION_SALIDA</option>
              <option value="REGISTRÓ_INSPECCION_LLEGADA">REGISTRÓ_INSPECCION_LLEGADA</option>
              <option value="ACTUALIZÓ_TARIFA">ACTUALIZÓ_TARIFA</option>
              <option value="ACTIVÓ_CONVENIO">ACTIVÓ_CONVENIO</option>
              <option value="DESACTIVÓ_CONVENIO">DESACTIVÓ_CONVENIO</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="gold"
              isLoading={loading}
              icon={<Search size={16} />}
            >
              Filtrar Logs
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setPage(1);
                setLoading(true);
                fetchSystemLogs({ page: 1 }).then(res => {
                  setLogs(res.data);
                  setPage(res.current_page);
                  setTotalPages(res.last_page);
                  setTotalLogs(res.total);
                  setLoading(false);
                });
              }}
            >
              Limpiar
            </Button>
          </div>

        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="spinner mb-4" style={{ width: '36px', height: '36px' }}></div>
          <p className="text-muted text-xs">Cargando logs del sistema...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
          <ShieldAlert className="text-gray-300 mb-2 mx-auto" size={44} />
          <p className="font-semibold text-gray-500 text-sm">Sin logs registrados</p>
          <p className="text-muted text-xs max-w-sm mt-1 mx-auto">No se encontraron eventos en la bitácora que coincidan con los filtros de búsqueda aplicados.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/75 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Fecha / Hora</th>
                  <th scope="col" className="px-6 py-3.5">Usuario Auditor</th>
                  <th scope="col" className="px-6 py-3.5">Acción Realizada</th>
                  <th scope="col" className="px-6 py-3.5">Tabla Afectada</th>
                  <th scope="col" className="px-6 py-3.5 text-center">IP Origen</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="bg-transparent border-b border-slate-100 dark:border-slate-800/40 last:border-0 hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-primary text-xs flex items-center gap-1">
                            <User size={12} className="text-primary-brand" />
                            {log.user.first_name} {log.user.last_name}
                          </span>
                          <span className="text-[10px] text-gray-400">{log.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sistema Autónomo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs text-primary max-w-sm">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-secondary-brand font-bold uppercase whitespace-nowrap">
                      {log.affected_table}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-gray-500 whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 select-none">
            <span className="text-xs text-gray-500">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> (Total: <strong>{totalLogs}</strong> registros)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                disabled={page === 1}
                onClick={() => {
                  const target = page - 1;
                  setPage(target);
                  loadLogs(target);
                }}
              >
                Anterior
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                disabled={page === totalPages}
                onClick={() => {
                  const target = page + 1;
                  setPage(target);
                  loadLogs(target);
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditLogsPage;
