import React, { useState, useEffect } from 'react';
import {
  Fuel,
  ClipboardCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import { FUEL_TYPE_LABEL, labelOf } from '@/lib/labels';
import api from '@/services/api'; // fallback for direct routes
import {
  fetchDriverFuelOrders,
  fetchServiceStations,
  emitFuelOrder,
  type FuelOrder,
  type ServiceStation,
} from '../api/fuel';

interface PendingSheetRecord {
  id: number;
  vehicle: {
    plate: string;
    brand: string;
  };
  request: {
    destination: string;
  };
}

const DriverFuelTicketsPage: React.FC = () => {
  const { roleIds } = useAuth();
  const canManageFuel = roleIds.includes('secretaria');
  const [orders, setOrders] = useState<FuelOrder[]>([]);
  const [stations, setStations] = useState<ServiceStation[]>([]);
  const [routeSheets, setRouteSheets] = useState<PendingSheetRecord[]>([]);

  // Selection states for issuing a voucher (Jefe de Transporte only)
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [issuing, setIssuing] = useState<boolean>(false);

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordersData = await fetchDriverFuelOrders();
      setOrders(ordersData);

      // If Jefe de Transporte, load helper data for issuing new tickets
      if (canManageFuel) {
        const [stationsData, sheetsResponse] = await Promise.all([
          fetchServiceStations(),
          api.get<PendingSheetRecord[]>('/inspecciones/pendientes'),
        ]);
        setStations(stationsData);
        setRouteSheets(sheetsResponse.data);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Error al cargar vales de combustible. Por favor, recarga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetchDriverFuelOrders()
      .then(async (ordersData) => {
        if (!ignore) {
          setOrders(ordersData);
        }
        if (canManageFuel) {
          const [stationsData, sheetsResponse] = await Promise.all([
            fetchServiceStations(),
            api.get<PendingSheetRecord[]>('/inspecciones/pendientes'),
          ]);
          if (!ignore) {
            setStations(stationsData);
            setRouteSheets(sheetsResponse.data);
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error(err);
          setErrorMsg('Error al cargar vales de combustible. Por favor, recarga.');
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
  }, [canManageFuel]);

  const handleEmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheetId || !selectedStationId) return;

    setIssuing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await emitFuelOrder({
        route_sheet_id: Number(selectedSheetId),
        station_id: Number(selectedStationId),
      });
      setSuccessMsg('Vale digital de combustible emitido con éxito.');
      setSelectedSheetId('');
      setSelectedStationId('');

      // Reload
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const er = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        er.response?.data?.message || 'Error al emitir el vale de combustible.'
      );
    } finally {
      setIssuing(false);
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
            <Fuel className="text-secondary-brand" size={28} />
            Vales de Combustible ULEAM
          </h1>
          <p className="text-muted mt-1">
            {canManageFuel
              ? 'Administración y emisión de vales digitales autorizados de abastecimiento.'
              : 'Tus boletos digitales activos de abastecimiento para comisiones institucionales.'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner mb-6 flex items-start gap-3">
          <CheckCircle2
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
          headline="Vales de Combustible ULEAM"
          author="Emisión, Control de Cupones Digitales y Abastecimiento de Flota"
          tag={{
            icon: <Fuel size={13} />,
            label: `${orders.length} Vales Digitales Registrados`,
          }}
          metricValue={orders.length}
          metricLabel="Vales Emitidos"
          gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
        />
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Vales"
          value={orders.length}
          hint="Historial institucional"
          icon={<Fuel size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Activos / Emitidos"
          value={orders.filter((o) => o.order_status === 'emitida').length}
          hint="Listos para despacho"
          icon={<ClipboardCheck size={16} />}
          tone="info"
        />
        <StatCard
          label="Despachados"
          value={orders.filter((o) => o.order_status === 'despachada').length}
          hint="Cargas completadas"
          icon={<CheckCircle2 size={16} />}
          tone="ok"
        />
        <StatCard
          label="Galones Autorizados"
          value={`${orders.reduce((sum, o) => sum + (Number(o.authorized_gallons) || 0), 0)} Gal`}
          hint="Volumen combustible"
          icon={<Fuel size={16} />}
          tone="neutral"
        />
      </div>

      {canManageFuel && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <ResourceCard
            title="Convenios de Gasolineras"
            subtitle="Precios por litro, cupos mensuales y contratos"
            icon={<Fuel size={18} />}
            href="/app/secretaria/gasolineras"
          />
          <ResourceCard
            title="Panel de Transporte"
            subtitle="Hojas de ruta y asignación de vehículos"
            icon={<ClipboardCheck size={18} />}
            href="/app/secretaria/solicitudes"
          />
          <ResourceCard
            title="Auditoría de Liquidaciones"
            subtitle="Bandeja de revisión económica"
            icon={<CheckCircle2 size={18} />}
            href="/app/secretaria/economico"
          />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="spinner mb-4"
            style={{ width: '40px', height: '40px' }}
          ></div>
          <p className="text-muted">
            Cargando vales y registros de combustible...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Columna Izquierda: Emisión de Vale (Solo Jefe de Transporte) */}
        {canManageFuel && (
            <div className="xl:col-span-1 flex flex-col gap-6">
              <div className="glass-panel p-6 bg-white/50">
                <h2 className="section-title flex items-center gap-2 mb-4">
                  <ClipboardCheck size={18} className="text-primary-brand" />
                  Emitir Vale de Combustible
                </h2>
                <p className="text-muted text-xs mb-4">
                  Formaliza una hoja de ruta autorizando el cupo de combustible
                  de viaje de ida.
                </p>

                <form
                  onSubmit={handleEmitVoucher}
                  className="flex flex-col gap-4"
                >
                  <div className="form-group">
                    <label className="form-label" htmlFor="route-sheet-select">
                      Hoja de Ruta
                    </label>
                    <select
                      id="route-sheet-select"
                      className="form-input"
                      value={selectedSheetId}
                      onChange={(e) => setSelectedSheetId(e.target.value)}
                      required
                    >
                      <option value="">-- Seleccionar Hoja de Ruta --</option>
                      {routeSheets
                        // Only allow route sheets that do not have a fuel order already
                        .filter(
                          (sheet) =>
                            !orders.some((o) => o.route_sheet_id === sheet.id)
                        )
                        .map((sheet) => (
                          <option key={sheet.id} value={sheet.id}>
                            [{sheet.vehicle.plate}] {sheet.vehicle.brand} -{' '}
                            {sheet.request.destination}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="station-select">
                      Estación de Servicio
                    </label>
                    <select
                      id="station-select"
                      className="form-input"
                      value={selectedStationId}
                      onChange={(e) => setSelectedStationId(e.target.value)}
                      required
                    >
                      <option value="">-- Seleccionar Estación --</option>
                      {stations.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.commercial_name} (RUC: {st.ruc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    isLoading={issuing}
                    icon={<Fuel size={18} />}
                  >
                    Emitir Vale Digital
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Columna Derecha: Vista de Boletos/Tickets */}
          <div
            className={`${canManageFuel ? 'xl:col-span-2' : 'xl:col-span-3'}`}
          >
            <h2 className="section-title flex items-center gap-2 mb-6">
              <ClipboardCheck size={18} className="text-primary-brand" />
              Tus Vales Digitales Activos / Historial
            </h2>

            {orders.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
                <Fuel className="text-gray-300 mb-4 mx-auto" size={48} />
                <p className="font-semibold text-gray-500">
                  Sin vales emitidos
                </p>
                <p className="text-muted text-sm max-w-sm mt-1 mx-auto">
                  No hay vales de combustible registrados para comisiones
                  operativas en este momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.map((order) => {
                  const isConsumed = order.order_status === 'despachada';

                  return (
                    <div
                      key={order.id}
                      className={`relative overflow-hidden rounded-3xl border shadow-sm bg-white flex flex-col md:flex-row transition-all hover:border-gray-350 ${
                        isConsumed
                          ? 'border-gray-200 opacity-75'
                          : 'border-gold/30 ring-1 ring-gold/5'
                      }`}
                    >
                      {/* Ticket Left Side: Info Card */}
                      <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-gray-200">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                isConsumed
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-gold/15 text-gold-dark border border-gold/20'
                              }`}
                            >
                              {order.order_status === 'emitida'
                                ? 'ACTIVO'
                                : 'DESPACHADO'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              #{order.order_code}
                            </span>
                          </div>

                          <h3 className="font-bold text-primary text-base flex items-center gap-1.5">
                            <MapPin
                              size={16}
                              className="text-secondary-brand flex-shrink-0"
                            />
                            {order.station.commercial_name}
                          </h3>
                          <p className="text-muted text-xs mt-1">
                            {order.station.address}
                          </p>

                          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                            <div>
                              <p className="text-gray-400">Placa Vehículo</p>
                              <p className="font-bold text-primary font-mono text-sm uppercase">
                                {order.route_sheet.vehicle.plate}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Tipo Combustible</p>
                              <p className="font-bold text-gold-dark font-mono text-sm capitalize">
                                {labelOf(FUEL_TYPE_LABEL, order.dispatched_fuel_type)}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-400">
                                Destino de la Comisión
                              </p>
                              <p className="font-semibold text-primary">
                                {order.route_sheet.request.destination}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar of Cupo */}
                        <div className="mt-6">
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-primary">
                              Cupo Máximo Autorizado
                            </span>
                            <span className="text-gold-dark">
                              {order.authorized_gallons} Galones
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isConsumed ? 'bg-gray-400' : 'bg-gold'
                              }`}
                              style={{ width: '100%' }}
                            ></div>
                          </div>

                          {isConsumed && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-[11px] font-bold text-gray-500">
                              <span>
                                Despachado: {order.actual_dispatched_gallons}{' '}
                                Gal.
                              </span>
                              <span>
                                Total Pagado: $
                                {order.total_amount_paid?.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ticket Right Side: código del vale */}
                      <div className="p-6 md:w-44 flex flex-col items-center justify-center bg-gray-50/50 shrink-0">
                        <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-xs">
                          <ClipboardCheck
                            className="mx-auto mb-2 text-primary-brand"
                            size={26}
                            aria-hidden="true"
                          />
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Código del vale
                          </p>
                          <p className="mt-1 break-all text-center font-mono font-bold text-sm text-primary">
                            {order.order_code}
                          </p>
                          {isConsumed && (
                            <span className="mt-3 inline-flex rounded-full border border-gray-300 px-2 py-1 text-[10px] font-bold text-gray-600">
                              DESPACHADO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverFuelTicketsPage;
