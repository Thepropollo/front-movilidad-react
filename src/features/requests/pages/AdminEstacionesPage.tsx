import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Edit3, AlertTriangle, CheckCircle, MapPin, CreditCard } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import {
  fetchAdminStations,
  createAdminStation,
  updateAdminStation,
  toggleAdminStationAgreement,
  type ServiceStation
} from '../api/admin_crud';

const AdminEstacionesPage: React.FC = () => {
  const [stations, setStations] = useState<ServiceStation[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStation, setEditingStation] = useState<ServiceStation | null>(null);

  // Form fields
  const [commercialName, setCommercialName] = useState<string>('');
  const [ruc, setRuc] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminStations();
      setStations(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar las estaciones de servicio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingStation(null);
    setCommercialName('');
    setRuc('');
    setAddress('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (station: ServiceStation) => {
    setEditingStation(station);
    setCommercialName(station.commercial_name);
    setRuc(station.ruc);
    setAddress(station.address);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate RUC (13 digits)
    if (!/^\d{13}$/.test(ruc)) {
      setErrorMsg('El RUC debe tener exactamente 13 dígitos numéricos.');
      return;
    }

    setSaving(true);
    const payload = {
      commercial_name: commercialName,
      ruc,
      address,
      active_agreement: editingStation ? editingStation.active_agreement : true
    };

    try {
      if (editingStation) {
        const res = await updateAdminStation(editingStation.id, payload);
        setSuccessMsg(res.message);
      } else {
        const res = await createAdminStation(payload);
        setSuccessMsg(res.message);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al guardar la estación de servicio.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAgreement = async (station: ServiceStation) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Optimistic update
      setStations(prev =>
        prev.map(s => s.id === station.id ? { ...s, active_agreement: !s.active_agreement } : s)
      );
      const res = await toggleAdminStationAgreement(station.id);
      setSuccessMsg(res.message);
      // Refresh to ensure server sync
      const data = await fetchAdminStations();
      setStations(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al actualizar el convenio.');
      loadData(); // revert
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
            <Fuel className="text-secondary" size={24} />
            Gestión de Estaciones de Servicio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra los convenios de las gasolineras autorizadas para el despacho de combustible.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenCreate}
          icon={<Plus size={16} />}
          fullWidth={false}
          className="shrink-0"
        >
          Agregar Estación
        </Button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-sm animate-fade-in">
          <CheckCircle size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 text-sm animate-fade-in">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-12 text-center">
          <Fuel className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No hay estaciones registradas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Registra convenios de gasolineras para comenzar a emitir vales de combustible.</p>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div
              key={station.id}
              className={`bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-colors duration-200 flex flex-col justify-between ${
                station.active_agreement ? '' : 'opacity-75'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-primary dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    <Fuel size={20} />
                  </div>
                  {station.active_agreement ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      Convenio Activo
                    </span>
                  ) : (
                    <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      Convenio Pausado
                    </span>
                  )}
                </div>

                {/* Card Details */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-primary dark:text-white line-clamp-1">
                    {station.commercial_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <CreditCard size={14} className="shrink-0" />
                    <span>RUC: <strong className="font-mono">{station.ruc}</strong></span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin size={14} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{station.address}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions / Toggle */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleAgreement(station)}
                    type="button"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0b2545]/10 focus:ring-offset-2 ${
                      station.active_agreement ? 'bg-[#0b2545] dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        station.active_agreement ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Convenio
                  </span>
                </div>

                <button
                  onClick={() => handleOpenEdit(station)}
                  className="px-3 py-1.5 bg-gold/10 text-gold-dark hover:bg-gold/20 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-gold/25"
                >
                  <Edit3 size={13} />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingStation ? 'Editar Estación de Servicio' : 'Agregar Nueva Estación'}
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4 p-1">
            <Input
              label="Nombre Comercial"
              placeholder="Ej. Primax Tarqui"
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              required
              className="focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all"
            />

            <Input
              label="RUC de la Empresa"
              placeholder="13 dígitos numéricos"
              maxLength={13}
              value={ruc}
              onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
              required
              className="focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all"
            />

            <Input
              label="Dirección Completa"
              placeholder="Ej. Av. 108 y Calle 101, Manta"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0b2545] hover:bg-[#134074] text-white rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center gap-2"
              >
                {saving ? 'Guardando...' : 'Guardar Estación'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminEstacionesPage;
