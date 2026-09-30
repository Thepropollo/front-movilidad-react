import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Car,
  FileText,
} from 'lucide-react';
import Button from '@/components/Button';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import {
  fetchPendingLiquidations,
  approveLiquidation,
  type DriverCompensation,
} from '../api/postTrip';

const TransportAuditPanelPage: React.FC = () => {
  const [liquidations, setLiquidations] = useState<DriverCompensation[]>([]);
  const [selectedLiq, setSelectedLiq] = useState<DriverCompensation | null>(
    null
  );

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
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Error al cargar liquidaciones pendientes de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetchPendingLiquidations()
      .then((data) => {
        if (!ignore) {
          setLiquidations(data);
          setSelectedLiq(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error(err);
          setErrorMsg('Error al cargar liquidaciones pendientes de auditoría.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleApprove = async () => {
    if (!selectedLiq) return;
    if (
      !window.confirm(
        `¿Confirmas la aprobación y cierre financiero de la comisión #${selectedLiq.route_sheet_id}?`
      )
    ) {
      return;
    }

    setApproving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await approveLiquidation(selectedLiq.route_sheet_id);
      setSuccessMsg(
        `Comisión de viaje #${selectedLiq.route_sheet_id} aprobada y cerrada financieramente. Chofer liberado.`
      );
      setSelectedLiq(null);
      // Reload
      await loadLiquidations();
    } catch (err: unknown) {
      console.error(err);
      const er = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        er.response?.data?.message || 'Error al aprobar la liquidación.'
      );
    } finally {
      setApproving(false);
    }
  };

  return (
    <div
      className="glass-panel wide-container mx-auto"
      style={{ textAlign: 'left' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <ShieldCheck className="text-secondary-brand" size={28} />
            Auditoría de Liquidaciones Post-Viaje
          </h1>
          <p className="text-muted mt-1">
            Valida las planillas de haberes del chofer y los comprobantes
            físicos antes de cerrar la comisión.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner mb-6 flex items-start gap-3">
          <CheckCircle
            className="text-success flex-shrink-0 mt-0.5"
            size={18}
          />
          <p className="text-success-text text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3">
          <AlertTriangle
            className="text-danger flex-shrink-0 mt-0.5"
            size={18}
          />
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Hero Metric Banner Card */}
      <div className="mb-6">
        <HeroMetricCard
          headline="Auditoría de Liquidaciones Post-Viaje"
          author="Validación Financiera de Viáticos, Combustibles y Haberes de Chofer"
          tag={{
            icon: <FileCheck size={13} />,
            label: `${liquidations.length} Liquidaciones Esperando Dictamen`,
          }}
          metricValue={liquidations.length}
          metricLabel="Por Auditar"
          gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
        />
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="En Espera"
          value={liquidations.length}
          hint="Planillas remitidas"
          icon={<FileCheck size={16} />}
          tone={liquidations.length > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Monto por Auditar"
          value={`$${liquidations.reduce((sum, l) => sum + (Number(l.total_payout) || 0), 0).toFixed(2)}`}
          hint="Total haberes pendientes"
          icon={<DollarSign size={16} />}
          tone="info"
        />
        <StatCard
          label="Promedio / Viaje"
          value={`$${liquidations.length ? (liquidations.reduce((sum, l) => sum + (Number(l.total_payout) || 0), 0) / liquidations.length).toFixed(2) : '0.00'}`}
          hint="Cálculo compensatorio"
          icon={<DollarSign size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Estado Auditoría"
          value={liquidations.length === 0 ? 'Al Día' : 'Revisión'}
          hint={liquidations.length === 0 ? 'Sin atrasos' : 'Pendientes de firma'}
          icon={<ShieldCheck size={16} />}
          tone={liquidations.length === 0 ? 'ok' : 'warn'}
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ResourceCard
          title="Vales de Combustible"
          subtitle="Verificar tickets y cupones despachados"
          icon={<DollarSign size={18} />}
          href="/app/secretaria/combustible/despacho"
        />
        <ResourceCard
          title="Panel de Transporte"
          subtitle="Hojas de ruta y despacho de móviles"
          icon={<Car size={18} />}
          href="/app/secretaria/asignar"
        />
        <ResourceCard
          title="Historial de Documentos"
          subtitle="Archivo de actas, liquidaciones e informes"
          icon={<FileText size={18} />}
          href="/app/secretaria/documentos"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="spinner mb-4"
            style={{ width: '40px', height: '40px' }}
          ></div>
          <p className="text-muted">
            Cargando liquidaciones pendientes de auditoría...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Liquidaciones pendientes */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 bg-white/50">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <FileCheck size={18} className="text-primary-brand" />
                Liquidaciones en Espera
              </h2>
              <p className="text-muted text-xs mb-4">
                Planillas con comprobante cargado que requieren verificación de
                movilidad.
              </p>

              {liquidations.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
                  <ShieldCheck
                    className="text-gray-300 mb-2 mx-auto"
                    size={32}
                  />
                  <p className="font-semibold text-gray-500 text-xs">
                    Bandeja de Entrada Limpia
                  </p>
                  <p className="text-muted text-[10px] mt-1">
                    No hay liquidaciones post-viaje esperando auditoría en este
                    momento.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  {liquidations.map((liq) => (
                    <button
                      key={liq.id}
                      onClick={() => setSelectedLiq(liq)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedLiq?.id === liq.id
                          ? 'border-gold bg-gold/5 ring-1 ring-gold/20 shadow-xs'
                          : 'border-gray-150 hover:border-gray-250 bg-white'
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
                      <p className="font-bold text-primary text-sm">
                        Destino: {liq.route_sheet.request.destination}
                      </p>
                      <p className="text-muted text-[11px] mt-1">
                        Chofer: {liq.route_sheet.driver.user.first_name}{' '}
                        {liq.route_sheet.driver.user.last_name}
                      </p>
                      <p className="font-bold text-gold-dark text-xs mt-2">
                        Total planilla: ${liq.total_payout.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle de auditoría */}
          <div className="lg:col-span-2">
            {!selectedLiq ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
                <ShieldCheck className="text-gray-300 mb-4" size={48} />
                <p className="font-semibold text-gray-500">
                  Módulo de Auditoría Financiera
                </p>
                <p className="text-muted text-sm max-w-sm mt-1">
                  Selecciona una planilla del listado de la izquierda para
                  previsualizar los montos, inspeccionar el comprobante y
                  archivar la comisión.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Info Header */}
                <div className="glass-panel p-6 bg-white/50">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <User size={18} className="text-primary-brand" />
                    Detalles Generales del Viaje
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                      <User className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Conductor</p>
                        <p className="font-bold text-primary">
                          {selectedLiq.route_sheet.driver.user.first_name}{' '}
                          {selectedLiq.route_sheet.driver.user.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                      <Car className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Vehículo Utilizado</p>
                        <p className="font-bold text-primary">
                          {selectedLiq.route_sheet.vehicle.brand} (
                          {selectedLiq.route_sheet.vehicle.plate})
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                      <Calendar className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Ruta y Comisión</p>
                        <p className="font-bold text-primary">
                          Manta → {selectedLiq.route_sheet.request.destination}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
                      <DollarSign className="text-primary-brand" size={16} />
                      <div>
                        <p className="text-gray-400">Docente Solicitante</p>
                        <p className="font-bold text-primary">
                          {selectedLiq.route_sheet.request.requester.first_name}{' '}
                          {selectedLiq.route_sheet.request.requester.last_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planilla de Haberes */}
                <div className="glass-panel p-6 bg-white/50">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <DollarSign size={18} className="text-primary-brand" />
                    Liquidación Computada
                  </h2>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">
                        Viáticos de Comisión Exterior
                      </span>
                      <span className="font-bold text-primary font-mono">
                        ${selectedLiq.allowances_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">
                        Horas Suplementarias (50%)
                      </span>
                      <span className="font-bold text-primary font-mono">
                        ${selectedLiq.overtime_50_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">
                        Horas Extraordinarias (100%)
                      </span>
                      <span className="font-bold text-primary font-mono">
                        ${selectedLiq.overtime_100_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-gold/10 px-3 rounded-xl mt-2">
                      <span className="font-bold text-primary">
                        Total Liquidación Conductor
                      </span>
                      <span className="font-black text-gold-dark font-mono">
                        ${selectedLiq.total_payout.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Referencia del comprobante registrada por el backend */}
                <div className="glass-panel p-6 bg-white/50">
                  <h2 className="section-title flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-primary-brand" />
                    Comprobante y observaciones
                  </h2>

                  <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50">
                    {selectedLiq.payment_receipt_url?.startsWith('DISPUTA:') ? (
                      <p className="text-sm text-amber-900" role="status">
                        Observación del conductor:{' '}
                        {selectedLiq.payment_receipt_url.slice('DISPUTA:'.length).trim()}
                      </p>
                    ) : selectedLiq.payment_receipt_url ? (
                      <p className="text-sm text-primary break-all">
                        Referencia registrada:{' '}
                        {selectedLiq.payment_receipt_url}
                      </p>
                    ) : (
                      <p className="text-sm text-muted" role="status">
                        No hay referencia de comprobante registrada.
                      </p>
                    )}
                    <p className="text-xs text-muted mt-2">
                      El API no ofrece una ruta para visualizar o descargar el archivo de respaldo.
                    </p>
                  </div>
                </div>

                {/* Acciones de Auditoría */}
                <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Al aprobar la comisión, el estado del viaje pasará a
                      'finalizado', se cerrará el asiento financiero y el
                      conductor quedará disponible para nuevas comisiones.
                    </p>

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
