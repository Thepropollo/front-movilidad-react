import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Fuel, Milestone, ClipboardCheck, Wrench, Download, BarChart2, Calendar, Landmark } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { fetchAdminKpis, fetchFacultyReport, type AdminKpis, type FacultyReportItem } from '../api/admin';

const AdminDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [report, setReport] = useState<FacultyReportItem[]>([]);
  
  // Report date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // UI states
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadKpis = async () => {
    try {
      setLoadingKpis(true);
      const data = await fetchAdminKpis();
      setKpis(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar indicadores de desempeño (KPIs).');
    } finally {
      setLoadingKpis(false);
    }
  };

  const loadReport = async () => {
    try {
      setLoadingReport(true);
      const data = await fetchFacultyReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setReport(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al generar el reporte de facultades.');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadKpis();
    loadReport();
  }, []);

  const handleExportJson = () => {
    if (report.length === 0) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_comisiones_facultad_${startDate || 'total'}_a_${endDate || 'total'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <LayoutDashboard className="text-secondary-brand" size={28} />
            Analítica y Control de Movilidad
          </h1>
          <p className="text-muted mt-1">Monitorea indicadores clave de la flota institucional y genera reportes de asignación de recursos.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3">
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      {/* KPI Cards section */}
      {loadingKpis ? (
        <div className="flex flex-col items-center justify-center py-6 mb-8 border border-gray-150 rounded-3xl bg-white/50">
          <div className="spinner mb-2" style={{ width: '28px', height: '28px' }}></div>
          <p className="text-muted text-xs">Cargando KPIs...</p>
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* KPI 1: Fuel */}
          <div className="glass-panel p-6 bg-gradient-to-br from-white to-gold/5 border border-gold/10 hover:border-gold/25 transition-all shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-gold/15 text-gold-dark rounded-2xl shrink-0">
              <Fuel size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Galones del Mes</p>
              <h3 className="text-2xl font-black text-primary font-mono mt-0.5">{kpis.total_gallons.toFixed(2)}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Consumo real despachado</p>
            </div>
          </div>

          {/* KPI 2: Kilometers */}
          <div className="glass-panel p-6 bg-gradient-to-br from-white to-blue-50/10 border border-gray-150 hover:border-gray-250 transition-all shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-blue-100/60 text-primary-brand rounded-2xl shrink-0">
              <Milestone size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Km Totales Flota</p>
              <h3 className="text-2xl font-black text-primary font-mono mt-0.5">{kpis.total_km.toLocaleString()} km</h3>
              <p className="text-[10px] text-gray-400 mt-1">Recorridos acumulados</p>
            </div>
          </div>

          {/* KPI 3: Finalized Trips */}
          <div className="glass-panel p-6 bg-gradient-to-br from-white to-green-50/10 border border-gray-150 hover:border-gray-250 transition-all shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-green-100/60 text-success rounded-2xl shrink-0">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Viajes Finalizados</p>
              <h3 className="text-2xl font-black text-primary font-mono mt-0.5">{kpis.total_trips}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Comisiones archivadas</p>
            </div>
          </div>

          {/* KPI 4: Workshop */}
          <div className="glass-panel p-6 bg-gradient-to-br from-white to-red-50/10 border border-gray-150 hover:border-gray-250 transition-all shadow-xs flex items-center gap-4">
            <div className="p-3.5 bg-red-100/60 text-danger rounded-2xl shrink-0">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Flota en Taller</p>
              <h3 className="text-2xl font-black text-primary font-mono mt-0.5">{kpis.vehicles_in_workshop}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Vehículos bloqueados</p>
            </div>
          </div>

        </div>
      ) : null}

      {/* Faculty Report and Date range filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Date selector */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
            <h2 className="section-title flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-primary-brand" />
              Filtrar Reporte
            </h2>
            <p className="text-muted text-xs mb-6">Establece un rango de fechas de salida para agrupar los gastos de comisiones por cada facultad.</p>

            <div className="flex flex-col gap-4">
              <Input
                label="Fecha Inicial"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                icon={<Calendar size={16} />}
              />

              <Input
                label="Fecha Final"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                icon={<Calendar size={16} />}
              />

              <div className="flex flex-col gap-3 mt-4">
                <Button
                  type="button"
                  variant="gold"
                  isLoading={loadingReport}
                  onClick={loadReport}
                  icon={<BarChart2 size={16} />}
                >
                  Generar Reporte
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={report.length === 0}
                  onClick={handleExportJson}
                  icon={<Download size={16} />}
                >
                  Exportar Reporte a JSON
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Report Table */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40 h-full flex flex-col justify-between">
            <div>
              <h2 className="section-title flex items-center justify-between gap-2 mb-6">
                <span className="flex items-center gap-2">
                  <Landmark size={18} className="text-primary-brand" />
                  Distribución Presupuestaria por Facultades
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Total Registros: {report.length}
                </span>
              </h2>

              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="spinner mb-4" style={{ width: '36px', height: '36px' }}></div>
                  <p className="text-muted text-xs">Cargando reporte de distribución...</p>
                </div>
              ) : report.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-700/60 rounded-2xl p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
                  <BarChart2 className="text-gray-300 mb-2 mx-auto" size={44} />
                  <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Sin datos para mostrar</p>
                  <p className="text-muted text-xs max-w-sm mt-1 mx-auto">No se registraron solicitudes de viaje dentro del rango seleccionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/75 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th scope="col" className="px-6 py-3.5">Facultad / Institución</th>
                        <th scope="col" className="px-6 py-3.5 text-center">Viajes Realizados</th>
                        <th scope="col" className="px-6 py-3.5 text-right">Presupuesto Proyectado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((item, idx) => (
                        <tr key={idx} className="bg-transparent border-b border-slate-100 dark:border-slate-800/40 last:border-0 hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate capitalize">
                            {item.faculty ? item.faculty.toLowerCase() : 'Administración / Rectorado'}
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.total_trips}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-black text-gold-dark text-base">
                            ${Number(item.total_cost).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {report.length > 0 && (
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Total Consolidado</span>
                <span className="font-mono text-base font-black text-gold-dark">
                  ${report.reduce((acc, curr) => acc + Number(curr.total_cost), 0).toFixed(2)} USD
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboardPage;
