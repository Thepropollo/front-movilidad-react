import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, CheckCircle, AlertTriangle, Eye, DollarSign, Calendar, User, Car, FileText } from 'lucide-react';
import Button from '@/components/Button';
import { fetchPendingLiquidations, approveLiquidation, type DriverCompensation } from '../api/postTrip';

const TransportAuditPanelPage: React.FC = () => {
  const [liquidations, setLiquidations] = useState<DriverCompensation[]>([]);
  const [selectedLiq, setSelectedLiq] = useState<DriverCompensation | null>(null);

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [approving, setApproving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLiquidations = async () => {
    try {
      setLoading(true);
      const data = await fetchPendingLiquidations();
      setLiquidations(data);
      setSelectedLiq(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar liquidaciones pendientes de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiquidations();
  }, []);

  const handleApprove = async () => {
    if (!selectedLiq) return;

    setApproving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await approveLiquidation(selectedLiq.route_sheet_id);
      setSuccessMsg(`Comisión de viaje #${selectedLiq.route_sheet_id} aprobada y cerrada financieramente. Chofer liberado.`);
      setSelectedLiq(null);
      // Reload
      const data = await fetchPendingLiquidations();
      setLiquidations(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al aprobar la liquidación.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <ShieldCheck className="text-secondary-brand" size={28} />
            Auditoría de Liquidaciones Post-Viaje
          </h1>
          <p className="text-muted mt-1">Valida las planillas de haberes del chofer y los comprobantes físicos antes de cerrar la comisión.</p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner mb-6 flex items-start gap-3">
          <CheckCircle className="text-success flex-shrink-0 mt-0.5" size={18} />
          <p className="text-success-text text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3">
          <AlertTriangle className="text-danger flex-shrink-0 mt-0.5" size={18} />
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner mb-4" style={{ width: '40px', height: '40px' }}></div>
          <p className="text-muted">Cargando liquidaciones pendientes de auditoría...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Liquidaciones pendientes */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <FileCheck size={18} className="text-primary-brand" />
                Liquidaciones en Espera
              </h2>
              <p className="text-muted text-xs mb-4">Planillas con comprobante cargado que requieren verificación de movilidad.</p>

              {liquidations.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/30">
                  <ShieldCheck className="text-gray-300 mb-2 mx-auto" size={32} />
                  <p className="font-semibold text-slate-600 dark:text-slate-300 text-xs">Bandeja de Entrada Limpia</p>
                  <p className="text-muted text-[10px] mt-1">No hay liquidaciones post-viaje esperando auditoría en este momento.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  {liquidations.map(liq => (
                    <button
                      key={liq.id}
                      onClick={() => setSelectedLiq(liq)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedLiq?.id === liq.id
                          ? 'border-gold bg-gold/5 ring-1 ring-gold/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          POR AUDITAR
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Viaje #{liq.route_sheet_id}
                        </span>
                      </div>
                      <p className="font-bold text-primary text-sm">Destino: {liq.route_sheet.request.destination}</p>
                      <p className="text-muted text-[11px] mt-1">Chofer: {liq.route_sheet.driver.user.first_name} {liq.route_sheet.driver.user.last_name}</p>
                      <p className="font-bold text-gold-dark text-xs mt-2">Total planilla: ${liq.total_payout.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle de auditoría */}
          <div className="lg:col-span-2">
            {!selectedLiq ? (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700/60 rounded-2xl p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
                <ShieldCheck className="text-gray-300 mb-4" size={48} />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Módulo de Auditoría Financiera</p>
                <p className="text-muted text-sm max-w-sm mt-1">Selecciona una planilla del listado de la izquierda para previsualizar los montos, inspeccionar el comprobante y archivar la comisión.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Info Header */}
                <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <User size={18} className="text-primary-brand" />
                    Detalles Generales del Viaje
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-3">
                      <User className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Conductor</p>
                        <p className="font-bold text-primary">{selectedLiq.route_sheet.driver.user.first_name} {selectedLiq.route_sheet.driver.user.last_name}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-3">
                      <Car className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Vehículo Utilizado</p>
                        <p className="font-bold text-primary">{selectedLiq.route_sheet.vehicle.brand} ({selectedLiq.route_sheet.vehicle.plate})</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-3">
                      <Calendar className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Ruta y Comisión</p>
                        <p className="font-bold text-primary">Manta → {selectedLiq.route_sheet.request.destination}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-3">
                      <DollarSign className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Docente Solicitante</p>
                        <p className="font-bold text-primary">{selectedLiq.route_sheet.request.requester.first_name} {selectedLiq.route_sheet.request.requester.last_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planilla de Haberes */}
                <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <DollarSign size={18} className="text-primary-brand" />
                    Liquidación Computada
                  </h2>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-gray-500">Viáticos de Comisión Exterior</span>
                      <span className="font-bold text-primary font-mono">${selectedLiq.allowances_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-gray-500">Horas Suplementarias (50%)</span>
                      <span className="font-bold text-primary font-mono">${selectedLiq.overtime_50_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-gray-500">Horas Extraordinarias (100%)</span>
                      <span className="font-bold text-primary font-mono">${selectedLiq.overtime_100_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-gold/10 px-3 rounded-xl mt-2">
                      <span className="font-bold text-primary">Total Liquidación Conductor</span>
                      <span className="font-black text-gold-dark font-mono">${selectedLiq.total_payout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Previsualización del Comprobante */}
                <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
                  <h2 className="section-title flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-primary-brand" />
                    Archivo de Respaldo Cargado
                  </h2>

                  <div className="border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                        <FileText size={28} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-primary">comprobante_viaje_{selectedLiq.route_sheet_id}.pdf</p>
                        <p className="text-xs text-muted">Tamaño: ~1.2 MB • Formato: PDF Document</p>
                      </div>
                    </div>

                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Abriendo previsualización simulada de comprobante: ${selectedLiq.payment_receipt_url}`);
                      }}
                      className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-700/60 text-primary dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Eye size={14} />
                      Ver Comprobante
                    </a>
                  </div>
                </div>

                {/* Acciones de Auditoría */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">Al aprobar la comisión, el estado del viaje pasará a 'finalizado', se cerrará el asiento financiero y el conductor quedará disponible para nuevas comisiones.</p>
                    
                    <Button
                      type="button"
                      variant="success"
                      isLoading={approving}
                      fullWidth={false}
                      onClick={handleApprove}
                      icon={<ShieldCheck size={18} />}
                      className="px-6 py-3 whitespace-nowrap bg-green-600 hover:bg-green-700"
                    >
                      Aprobar y Cerrar Comisión Financiera
                    </Button>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default TransportAuditPanelPage;
