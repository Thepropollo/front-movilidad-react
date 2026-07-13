import React, { useState, useEffect } from 'react';
import { Landmark, DollarSign, Edit3, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { fetchRates, updateRate, toggleServiceStationAgreement, type RateConfiguration, type ServiceStation } from '../api/admin';
import { fetchServiceStations } from '../api/fuel'; // reuse list API

const SystemMaintenancePage: React.FC = () => {
  const [rates, setRates] = useState<RateConfiguration[]>([]);
  const [stations, setStations] = useState<ServiceStation[]>([]);
  
  // Rate Edit Modal states
  const [editingRate, setEditingRate] = useState<RateConfiguration | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ratesData, stationsData] = await Promise.all([
        fetchRates(),
        fetchServiceStations() as unknown as Promise<ServiceStation[]> // cast to local interface
      ]);
      setRates(ratesData);
      setStations(stationsData);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar configuraciones del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditRate = (rate: RateConfiguration) => {
    setEditingRate(rate);
    setNewValue(rate.rate_value.toString());
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    const val = Number(newValue);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Por favor, ingresa un valor decimal válido.');
      return;
    }

    setUpdating(true);
    setErrorMsg(null);
    try {
      await updateRate(editingRate.id, val);
      setSuccessMsg(`Tarifa '${editingRate.rate_key}' actualizada a $${val.toFixed(2)}.`);
      setEditingRate(null);
      
      // Reload rates
      const ratesData = await fetchRates();
      setRates(ratesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al actualizar la tarifa.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAgreement = async (id: number) => {
    setTogglingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await toggleServiceStationAgreement(id);
      setSuccessMsg(`Convenio de '${updated.commercial_name}' actualizado.`);
      
      // Reload stations
      const stationsData = await fetchServiceStations() as unknown as ServiceStation[];
      setStations(stationsData);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cambiar el estado del convenio.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <Wrench className="text-secondary-brand" size={28} />
            Mantenimiento y Parámetros Globales
          </h1>
          <p className="text-muted mt-1">Administra los parámetros de facturación institucional y el estado de convenios con gasolineras externas.</p>
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
          <p className="text-muted">Cargando parámetros globales de mantenimiento...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Configuración de Tarifas */}
          <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
            <h2 className="section-title flex items-center gap-2 mb-6">
              <DollarSign size={18} className="text-primary-brand" />
              Configuración de Tarifas (LOSEP / Código de Trabajo)
            </h2>
            <p className="text-muted text-xs mb-4">Parámetros aplicados en el cálculo atómico de haberes del conductor por comisiones de servicio.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/75 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3">Concepto / Clave</th>
                    <th scope="col" className="px-4 py-3 text-center">Valor Actual</th>
                    <th scope="col" className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map(rate => (
                    <tr key={rate.id} className="bg-transparent border-b border-slate-100 dark:border-slate-800/40 last:border-0 hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-primary font-mono capitalize">
                        {rate.rate_key.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-primary text-base">
                        ${Number(rate.rate_value).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEditRate(rate)}
                          className="p-2 bg-gold/10 text-gold-dark hover:bg-gold/20 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Edit3 size={14} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Convenios de Estaciones de Servicio */}
          <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40">
            <h2 className="section-title flex items-center gap-2 mb-6">
              <Landmark size={18} className="text-primary-brand" />
              Gestión de Convenios con Estaciones de Servicio
            </h2>
            <p className="text-muted text-xs mb-4">Activa o desactiva convenios comerciales para la emisión de vales digitales autorizados.</p>

            <div className="flex flex-col gap-4">
              {stations.map(st => (
                <div 
                  key={st.id} 
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    st.active_agreement 
                      ? 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40' 
                      : 'border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-950/10 opacity-75'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-primary text-sm flex items-center gap-1.5">
                      <Landmark size={16} className="text-primary-brand" />
                      {st.commercial_name}
                    </p>
                    <p className="text-muted text-[11px] mt-0.5 font-mono">RUC: {st.ruc} • {st.address}</p>
                  </div>

                  {/* Toggle Agreement switch */}
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={st.active_agreement}
                        disabled={togglingId === st.id}
                        onChange={() => handleToggleAgreement(st.id)}
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                      <span className="ml-2 text-xs font-bold text-primary font-mono select-none w-16">
                        {st.active_agreement ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Edit Rate Modal */}
      {editingRate && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRate(null)}
          title={`Editar Tarifa: ${editingRate.rate_key.replace('_', ' ').toUpperCase()}`}
          size="sm"
        >
          <form onSubmit={handleUpdateRate} className="flex flex-col gap-4 p-1">
            <Input
              label="Valor Decimal ($)"
              type="number"
              step="0.01"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRate(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gold"
                isLoading={updating}
              >
                Guardar Tarifa
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default SystemMaintenancePage;
