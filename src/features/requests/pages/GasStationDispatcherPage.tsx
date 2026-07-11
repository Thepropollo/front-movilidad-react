import React, { useState } from 'react';
import { Search, Fuel, AlertTriangle, CheckCircle, Car, User, ShieldAlert, Award, RefreshCw, Landmark } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { fetchFuelOrderDetails, dispatchFuelOrder, type FuelOrder } from '../api/fuel';

const GasStationDispatcherPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState<string>('');
  const [order, setOrder] = useState<FuelOrder | null>(null);
  
  // Dispatch pump fields
  const [dispatchedGallons, setDispatchedGallons] = useState<string>('');
  const [totalPaid, setTotalPaid] = useState<string>('');
  
  // UI states
  const [searching, setSearching] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [lastDispatchedCode, setLastDispatchedCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) return;

    setSearching(true);
    setErrorMsg(null);
    setOrder(null);
    setSuccess(false);

    try {
      const details = await fetchFuelOrderDetails(orderCode.trim().toUpperCase());
      
      if (details.order_status !== 'emitida') {
        setErrorMsg(`Este vale de combustible no está activo. Estado actual: '${details.order_status}'.`);
      } else {
        setOrder(details);
        setDispatchedGallons(details.authorized_gallons.toString());
        // Auto-calculate approximate cost if fuel type is known
        // Diésel: ~$1.80/gal, Gasoline: ~$2.40/gal
        const pricePerGal = details.dispatched_fuel_type === 'diesel' ? 1.80 : 2.40;
        setTotalPaid((details.authorized_gallons * pricePerGal).toFixed(2));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Código de vale no encontrado en la base de datos.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const gallons = Number(dispatchedGallons);
    const paid = Number(totalPaid);

    if (isNaN(gallons) || gallons <= 0) {
      setErrorMsg('Por favor, ingresa una cantidad de galones válida.');
      return;
    }
    if (isNaN(paid) || paid <= 0) {
      setErrorMsg('Por favor, ingresa un valor de facturación válido.');
      return;
    }

    // Excedance check
    if (gallons > order.authorized_gallons) {
      setErrorMsg(`El despacho excede el límite de galones autorizados para este vale institucional (Cupo máximo: ${order.authorized_gallons} Gal).`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await dispatchFuelOrder(order.order_code, {
        galones_reales_despachados: gallons,
        valor_total_pagado: paid
      });
      setLastDispatchedCode(order.order_code);
      setSuccess(true);
      setOrder(null);
      setOrderCode('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al procesar el despacho de combustible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setOrderCode('');
    setOrder(null);
    setErrorMsg(null);
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <Landmark className="text-secondary-brand" size={28} />
            Simulador de Despacho en Gasolinera
          </h1>
          <p className="text-muted mt-1">Interfaz interactiva externa para que las estaciones de servicio validen y liquiden vales digitales.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3">
          <AlertTriangle className="text-danger flex-shrink-0 mt-0.5" size={18} />
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Success View */}
      {success ? (
        <div className="border border-green-200 bg-green-50 rounded-3xl p-8 max-w-2xl mx-auto text-center flex flex-col items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-success">
            <CheckCircle size={36} />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-green-800">Transacción Registrada</h2>
            <p className="text-green-700 font-medium mt-2">Liquidación del vale #{lastDispatchedCode} enviada a la Sección de Transporte ULEAM.</p>
          </div>

          <div className="bg-white border border-green-100 p-4 rounded-2xl w-full text-sm text-left grid grid-cols-2 gap-4 shadow-xs">
            <div>
              <p className="text-gray-400 text-xs">Galones Despachados</p>
              <p className="font-bold text-primary font-mono text-base">{dispatchedGallons} Galones</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Importe de Transacción</p>
              <p className="font-bold text-primary font-mono text-base">${Number(totalPaid).toFixed(2)} USD</p>
            </div>
          </div>

          <Button
            type="button"
            variant="success"
            fullWidth={false}
            onClick={handleReset}
            icon={<RefreshCw size={16} />}
            className="py-2.5 px-6"
          >
            Procesar Otro Vale
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Escanear / Digitar Código de Vale */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 bg-white/50">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <Fuel size={18} className="text-primary-brand" />
                Ingreso de Vale
              </h2>
              <p className="text-muted text-xs mb-4">Digita el código alfanumérico del vale digital presentado por el conductor institucional.</p>

              <form onSubmit={handleSearchOrder} className="flex flex-col gap-4">
                <Input
                  label="Código del Vale"
                  placeholder="Ej: ULEAM-FUEL12"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  icon={<Search size={16} />}
                  required
                />
                
                <Button
                  type="submit"
                  isLoading={searching}
                  variant="gold"
                >
                  Consultar Vale
                </Button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Detalle del Vale y Despacho */}
          <div className="lg:col-span-2">
            {!order ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
                <Search className="text-gray-300 mb-4" size={48} />
                <p className="font-semibold text-gray-500">Ningún vale consultado</p>
                <p className="text-muted text-sm max-w-sm mt-1">Ingresa el código del vale de combustible en el panel de la izquierda para cargar los datos del cupo y vehículo.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmDispatch} className="flex flex-col gap-6">
                
                {/* Voucher Details Card */}
                <div className="glass-panel p-6 bg-white/50">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <Car size={18} className="text-primary-brand" />
                    Detalles del Vehículo Autorizado
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Vehicle */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-white flex items-start gap-3 shadow-xs">
                      <div className="p-2 bg-primary-brand/10 text-primary-brand rounded-lg">
                        <Car size={20} />
                      </div>
                      <div>
                        <p className="text-muted text-xs">Vehículo</p>
                        <p className="font-bold text-primary">{order.route_sheet.vehicle.brand} {order.route_sheet.vehicle.model}</p>
                        <p className="font-mono text-xs text-secondary-brand font-bold uppercase">{order.route_sheet.vehicle.plate}</p>
                      </div>
                    </div>

                    {/* Fuel type */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-white flex items-start gap-3 shadow-xs">
                      <div className="p-2 bg-gold/15 text-gold-dark rounded-lg">
                        <Fuel size={20} />
                      </div>
                      <div>
                        <p className="text-muted text-xs">Combustible Autorizado</p>
                        <p className="font-bold text-gold-dark font-mono uppercase">{order.dispatched_fuel_type}</p>
                      </div>
                    </div>

                    {/* Driver */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-white flex items-start gap-3 shadow-xs">
                      <div className="p-2 bg-primary-brand/10 text-primary-brand rounded-lg">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-muted text-xs">Conductor</p>
                        <p className="font-bold text-primary">{order.route_sheet.driver.user.first_name} {order.route_sheet.driver.user.last_name}</p>
                        <p className="text-muted text-xs">Hoja Ruta: #{order.route_sheet_id}</p>
                      </div>
                    </div>

                    {/* Limit */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-white flex items-start gap-3 shadow-xs">
                      <div className="p-2 bg-green-50 text-success rounded-lg">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-muted text-xs">Cupo Máximo Autorizado</p>
                        <p className="font-bold text-success font-mono">{order.authorized_gallons} Galones</p>
                        <p className="text-muted text-xs">Destino: {order.route_sheet.request.destination}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Despacho en Bomba Form */}
                <div className="glass-panel p-6 bg-white/50">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <Fuel size={18} className="text-primary-brand" />
                    Liquidación de Bomba (Despachador)
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Galones Despachados"
                      type="number"
                      step="0.01"
                      value={dispatchedGallons}
                      onChange={(e) => setDispatchedGallons(e.target.value)}
                      required
                    />

                    <Input
                      label="Total a Cobrar ($)"
                      type="number"
                      step="0.01"
                      value={totalPaid}
                      onChange={(e) => setTotalPaid(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit Action Box */}
                <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <ShieldAlert className="text-primary-brand flex-shrink-0 mt-0.5" size={20} />
                      <p>Al confirmar el despacho, se descontará el cupo de combustible del vale digital y se notificará la liquidación al departamento de transporte.</p>
                    </div>

                    <Button
                      type="submit"
                      isLoading={submitting}
                      fullWidth={false}
                      variant="primary"
                      icon={<CheckCircle size={18} />}
                      className="px-6 py-3 whitespace-nowrap"
                    >
                      Confirmar Despacho de Bomba
                    </Button>
                  </div>
                </div>

              </form>
            )}
          </div>
          
        </div>
      )}

    </div>
  );
};

export default GasStationDispatcherPage;
