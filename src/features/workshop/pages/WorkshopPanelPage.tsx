import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Search,
  Calendar,
  User,
  Settings,
} from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import {
  fetchWorkshopData,
  fetchSupplies,
  fetchMechanicsList,
  createWorkOrder,
  closeWorkOrder,
  type IssueLog,
  type WorkOrder,
  type SupplyItem,
} from '../api/workshop';

const WorkshopPanelPage: React.FC = () => {
  const [issues, setIssues] = useState<IssueLog[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [mechanics, setMechanics] = useState<
    Array<{ id: number; first_name: string; last_name: string }>
  >([]);

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);

  // Selected items
  const [selectedIssue, setSelectedIssue] = useState<IssueLog | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Create Order Form states
  const [maintenanceType, setMaintenanceType] = useState<
    'preventivo' | 'correctivo' | 'cambio_aceite'
  >('correctivo');
  const [mechanicId, setMechanicId] = useState<string>('');
  const [workDetails, setWorkDetails] = useState<string>('');
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);

  // Close Order Form states
  const [suppliesSearch, setSuppliesSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SupplyItem[]>([]);
  const [selectedSupplies, setSelectedSupplies] = useState<
    Array<{ supply: SupplyItem; quantity: number }>
  >([]);
  const [closeSubmitting, setCloseSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workshopData, mechanicsData] = await Promise.all([
        fetchWorkshopData(),
        fetchMechanicsList(),
      ]);
      setIssues(workshopData.issues);
      setWorkOrders(workshopData.work_orders);
      setMechanics(mechanicsData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al conectar con el taller. Por favor, recarga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search supplies autocomplete
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (suppliesSearch.trim().length >= 2) {
        try {
          const results = await fetchSupplies(suppliesSearch);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [suppliesSearch]);

  const handleOpenOrderModal = (issue: IssueLog) => {
    setSelectedIssue(issue);
    setMaintenanceType('correctivo');
    setWorkDetails(issue.description);
    setMechanicId(mechanics[0]?.id.toString() || '');
    setIsOrderModalOpen(true);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleOpenCloseModal = (order: WorkOrder) => {
    setSelectedOrder(order);
    setSelectedSupplies([]);
    setSuppliesSearch('');
    setSearchResults([]);
    setIsCloseModalOpen(true);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !mechanicId) return;

    setOrderSubmitting(true);
    setErrorMsg(null);

    try {
      await createWorkOrder({
        issue_log_id: selectedIssue.id,
        vehicle_id: selectedIssue.vehicle_id,
        responsible_mechanic_id: Number(mechanicId),
        maintenance_type: maintenanceType,
        work_details: workDetails,
      });

      setSuccessMsg('Orden de trabajo iniciada. La novedad pasó a revisión.');
      setIsOrderModalOpen(false);

      // Reload lists
      const workshopData = await fetchWorkshopData();
      setIssues(workshopData.issues);
      setWorkOrders(workshopData.work_orders);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 'Error al iniciar la orden de trabajo.'
      );
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleAddSupply = (supply: SupplyItem) => {
    // Check if already added
    if (selectedSupplies.some((item) => item.supply.id === supply.id)) {
      return;
    }
    setSelectedSupplies((prev) => [...prev, { supply, quantity: 1 }]);
    setSuppliesSearch('');
    setSearchResults([]);
  };

  const handleRemoveSupply = (id: number) => {
    setSelectedSupplies((prev) => prev.filter((item) => item.supply.id !== id));
  };

  const handleQtyChange = (id: number, val: number) => {
    setSelectedSupplies((prev) =>
      prev.map((item) =>
        item.supply.id === id ? { ...item, quantity: Math.max(1, val) } : item
      )
    );
  };

  const handleCloseOrder = async () => {
    if (!selectedOrder) return;

    // Validate quantities are not exceeding stock
    for (const item of selectedSupplies) {
      if (item.quantity > item.supply.current_stock) {
        setErrorMsg(
          `Cantidad solicitada para ${item.supply.supply_name} supera el stock disponible (${item.supply.current_stock}).`
        );
        return;
      }
    }

    setCloseSubmitting(true);
    setErrorMsg(null);

    try {
      const suppliesPayload = selectedSupplies.map((item) => ({
        id: item.supply.id,
        quantity: item.quantity,
      }));

      await closeWorkOrder(selectedOrder.id, suppliesPayload);

      setSuccessMsg(
        'Unidad reparada con éxito. Vehículo liberado para circulación.'
      );
      setIsCloseModalOpen(false);

      // Reload lists
      const workshopData = await fetchWorkshopData();
      setIssues(workshopData.issues);
      setWorkOrders(workshopData.work_orders);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 'Error al cerrar la orden de trabajo.'
      );
    } finally {
      setCloseSubmitting(false);
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
            <Wrench className="text-secondary-brand" size={28} />
            Panel de Control del Taller
          </h1>
          <p className="text-muted mt-1">
            Gestión técnica del libro de novedades, órdenes de reparación e
            insumos de la flota.
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="spinner mb-4"
            style={{ width: '40px', height: '40px' }}
          ></div>
          <p className="text-muted">Cargando datos del taller...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Panel Izquierdo: Libro de Novedades (Alertas de Inspección) */}
          <div className="glass-panel p-6 bg-white/50 flex flex-col">
            <h2 className="section-title flex items-center gap-2 mb-4 text-red-700">
              <ShieldAlert size={20} />
              Libro de Novedades Activas
            </h2>
            <p className="text-muted text-xs mb-6">
              Alertas reportadas por el personal de garita o conductores durante
              el checklist digital.
            </p>

            {issues.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl py-12 text-center bg-gray-50/50">
                <CheckCircle2 className="text-green-300 mb-2" size={40} />
                <p className="font-semibold text-gray-500">
                  Sin novedades pendientes
                </p>
                <p className="text-muted text-xs mt-1">
                  Todos los vehículos se encuentran en buen estado operativo.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-red-100 bg-red-50/30 flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-red-800 font-mono text-sm mr-2">
                          {issue.vehicle.plate}
                        </span>
                        <span className="text-xs text-primary font-medium">
                          {issue.vehicle.brand} {issue.vehicle.model}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          issue.status === 'pendiente'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 font-medium">
                      "{issue.description}"
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 border-t border-gray-100/50 pt-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <User size={13} />
                        <span>
                          Reportado por: {issue.reporting_driver.first_name}{' '}
                          {issue.reporting_driver.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>
                          {new Date(issue.breakdown_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="gold"
                        fullWidth={false}
                        onClick={() => handleOpenOrderModal(issue)}
                        className="py-1.5 px-3 text-xs"
                      >
                        Generar Orden de Trabajo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Derecho: Órdenes de Trabajo en Curso */}
          <div className="glass-panel p-6 bg-white/50 flex flex-col">
            <h2 className="section-title flex items-center gap-2 mb-4 text-primary-brand">
              <Settings size={20} />
              Órdenes de Trabajo en Taller
            </h2>
            <p className="text-muted text-xs mb-6">
              Unidades actualmente bajo mantenimiento correctivo, preventivo o
              de lubricación.
            </p>

            {workOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl py-12 text-center bg-gray-50/50">
                <Wrench className="text-gray-300 mb-2" size={40} />
                <p className="font-semibold text-gray-500">Taller vacío</p>
                <p className="text-muted text-xs mt-1">
                  No hay órdenes de reparación activas en curso.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
                {workOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-primary font-mono text-sm mr-2">
                          {order.vehicle.plate}
                        </span>
                        <span className="text-xs text-primary font-medium">
                          {order.vehicle.brand} {order.vehicle.model}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.maintenance_type === 'cambio_aceite'
                            ? 'bg-blue-100 text-blue-800'
                            : order.maintenance_type === 'preventivo'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {order.maintenance_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg font-mono text-xs">
                      <p className="font-bold text-gray-600 mb-1">
                        TRABAJOS REQUERIDOS:
                      </p>
                      <p className="italic text-gray-800">
                        "{order.work_details}"
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 pt-1 gap-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <User size={13} />
                        <span>
                          Mecánico:{' '}
                          {order.responsible_mechanic?.first_name ||
                            'No asignado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>
                          Entrada:{' '}
                          {new Date(order.entry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth={false}
                        onClick={() => handleOpenCloseModal(order)}
                        className="py-1.5 px-3 text-xs"
                      >
                        Firmar Egreso Técnico (Cerrar)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Crear Orden de Trabajo */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Generar Orden de Trabajo Técnica"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => setIsOrderModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gold"
              fullWidth={false}
              isLoading={orderSubmitting}
              onClick={handleCreateOrder}
            >
              Iniciar Orden
            </Button>
          </>
        }
      >
        {selectedIssue && (
          <form className="flex flex-col gap-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm grid grid-cols-2 gap-2 border border-gray-100">
              <div>
                <p className="text-muted text-xs">Vehículo</p>
                <p className="font-semibold text-primary">
                  {selectedIssue.vehicle.brand} {selectedIssue.vehicle.model}
                </p>
                <p className="text-secondary-brand font-mono font-bold text-xs">
                  {selectedIssue.vehicle.plate}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs">Kilometraje de Entrada</p>
                <p className="font-semibold text-primary">
                  {selectedIssue.vehicle.current_mileage} km
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maintenance-type-select">
                Tipo de Mantenimiento
              </label>
              <select
                id="maintenance-type-select"
                className="form-input"
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value as any)}
              >
                <option value="correctivo">
                  Correctivo (Reparación de fallas)
                </option>
                <option value="preventivo">
                  Preventivo (Revisión programada)
                </option>
                <option value="cambio_aceite">
                  Cambio de Aceite (Lubricación + Filtros)
                </option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mechanic-select">
                Mecánico Responsable
              </label>
              <select
                id="mechanic-select"
                className="form-input"
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar Mecánico --</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="work-details-textarea">
                Especificaciones de Trabajo
              </label>
              <textarea
                id="work-details-textarea"
                rows={4}
                className="form-input"
                style={{ height: 'auto' }}
                value={workDetails}
                onChange={(e) => setWorkDetails(e.target.value)}
                placeholder="Describa el trabajo técnico a realizar en el taller..."
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: Cerrar Orden de Trabajo (Insumos) */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Firmar Egreso Técnico de Vehículo"
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => setIsCloseModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              fullWidth={false}
              isLoading={closeSubmitting}
              onClick={handleCloseOrder}
            >
              Firmar Egreso Técnico
            </Button>
          </>
        }
      >
        {selectedOrder && (
          <div className="flex flex-col gap-6">
            <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-150 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-muted text-xs">Unidad</p>
                <p className="font-semibold text-primary">
                  {selectedOrder.vehicle.brand} {selectedOrder.vehicle.model}
                </p>
                <p className="text-secondary-brand font-mono font-bold text-xs">
                  {selectedOrder.vehicle.plate}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs">Mecánico</p>
                <p className="font-semibold text-primary">
                  {selectedOrder.responsible_mechanic?.first_name}{' '}
                  {selectedOrder.responsible_mechanic?.last_name}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs">Tipo de Reparación</p>
                <p className="font-semibold text-primary capitalize">
                  {selectedOrder.maintenance_type.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Supplies selection section */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-primary text-sm flex items-center gap-1.5">
                <Settings size={16} /> Repuestos e Insumos Utilizados
              </h4>

              {/* Autocomplete Input */}
              <div className="relative">
                <Input
                  placeholder="Buscar repuesto (ej: Aceite, Pastillas, Filtros)..."
                  value={suppliesSearch}
                  onChange={(e) => setSuppliesSearch(e.target.value)}
                  icon={<Search size={16} />}
                />

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                    {searchResults.map((supply) => (
                      <button
                        key={supply.id}
                        type="button"
                        onClick={() => handleAddSupply(supply)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 text-sm flex justify-between items-center"
                      >
                        <span className="font-medium text-primary">
                          {supply.supply_name}
                        </span>
                        <span className="text-xs text-muted">
                          Stock: {supply.current_stock}{' '}
                          {supply.measurement_unit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Supplies Table */}
              {selectedSupplies.length === 0 ? (
                <p className="text-muted text-xs italic text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-150">
                  Ningún insumo o repuesto agregado a esta orden.
                </p>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 text-left">
                      <tr>
                        <th className="p-3">Insumo / Repuesto</th>
                        <th className="p-3 w-32">Cant. Utilizada</th>
                        <th className="p-3 w-28">Disponible</th>
                        <th className="p-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSupplies.map((item) => (
                        <tr
                          key={item.supply.id}
                          className="hover:bg-gray-50/40"
                        >
                          <td className="p-3">
                            <span className="font-semibold text-primary text-sm">
                              {item.supply.supply_name}
                            </span>
                            <span className="text-xs text-muted block">
                              {item.supply.measurement_unit}
                            </span>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQtyChange(
                                  item.supply.id,
                                  Number(e.target.value)
                                )
                              }
                              className="form-input py-1 px-2 text-center text-sm w-20"
                            />
                          </td>
                          <td className="p-3 text-xs font-semibold">
                            <span
                              className={
                                item.quantity > item.supply.current_stock
                                  ? 'text-danger'
                                  : 'text-success'
                              }
                            >
                              {item.supply.current_stock}{' '}
                              {item.supply.measurement_unit}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSupply(item.supply.id)}
                              className="text-gray-400 hover:text-danger p-1 rounded-md"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkshopPanelPage;
