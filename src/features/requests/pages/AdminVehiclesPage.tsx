import React, { useState, useEffect } from 'react';
import { Car, Plus, CheckCircle, AlertTriangle, Trash2, Edit3, Settings, Gauge, Calendar, Droplets } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { 
  fetchAdminVehicles, createAdminVehicle, updateAdminVehicle, deleteAdminVehicle,
  type Vehicle 
} from '../api/admin_crud';

const AdminVehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form fields
  const [plate, setPlate] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('diesel');
  const [currentMileage, setCurrentMileage] = useState<string>('0');
  const [nextOilChangeMileage, setNextOilChangeMileage] = useState<string>('5000');
  const [operationalStatus, setOperationalStatus] = useState<string>('disponible');

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar la flota de vehículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setPlate('');
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear().toString());
    setColor('');
    setFuelType('diesel');
    setCurrentMileage('0');
    setNextOilChangeMileage('5000');
    setOperationalStatus('disponible');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setPlate(v.plate);
    setBrand(v.brand);
    setModel(v.model);
    setYear(v.year.toString());
    setColor(v.color);
    setFuelType(v.fuel_type);
    setCurrentMileage(v.current_mileage.toString());
    setNextOilChangeMileage(v.next_oil_change_mileage.toString());
    setOperationalStatus(v.operational_status);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const mileageNum = Number(currentMileage);
    const nextOilNum = Number(nextOilChangeMileage);

    if (editingVehicle && mileageNum < editingVehicle.current_mileage) {
      setErrorMsg(`Validación de kilometraje: No puedes ingresar un kilometraje menor al registrado previamente (${editingVehicle.current_mileage} km).`);
      return;
    }

    setSaving(true);
    const payload = {
      plate: plate.toUpperCase(),
      brand,
      model,
      year: Number(year),
      color,
      fuel_type: fuelType,
      current_mileage: mileageNum,
      next_oil_change_mileage: nextOilNum,
      operational_status: operationalStatus
    };

    try {
      if (editingVehicle) {
        const res = await updateAdminVehicle(editingVehicle.id, payload);
        setSuccessMsg(res.message);
      } else {
        const res = await createAdminVehicle(payload);
        setSuccessMsg(res.message);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al guardar el vehículo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar o retirar este vehículo?')) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteAdminVehicle(id);
      setSuccessMsg(res.message);
      loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al intentar eliminar el vehículo.');
    }
  };

  // Helper status color classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_viaje':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_taller':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactivo':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <Car className="text-secondary-brand" size={28} />
            Flota Vehicular Institucional
          </h1>
          <p className="text-muted mt-1">Supervisa e ingresa unidades del parque automotor de la ULEAM, controlando mantenimientos de aceite.</p>
        </div>
        <Button
          type="button"
          variant="gold"
          onClick={handleOpenCreate}
          icon={<Plus size={16} />}
        >
          Agregar Vehículo
        </Button>
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
        <div className="flex flex-col items-center justify-center py-16">
          <div className="spinner mb-4" style={{ width: '36px', height: '36px' }}></div>
          <p className="text-muted text-xs">Cargando flota automotriz...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-700/60 rounded-3xl p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <Car className="text-gray-300 mb-2 mx-auto" size={44} />
          <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Sin vehículos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {vehicles.map((v) => (
            <div key={v.id} className="glass-panel p-6 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between">
              
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="text-left">
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-sm font-black text-primary border border-slate-200 dark:border-slate-700/60 uppercase">
                      {v.plate}
                    </span>
                    <h3 className="font-bold text-base text-primary mt-3 flex items-center gap-1.5">
                      <Car size={18} className="text-primary-brand" />
                      {v.brand} {v.model}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(v.operational_status)}`}>
                    {v.operational_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 py-4 my-2 border-t border-b border-slate-100 dark:border-slate-800 text-xs text-muted">
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Año: <strong className="text-primary">{v.year}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Droplets size={14} className="text-gray-400" />
                    <span className="capitalize">Comb: <strong className="text-primary">{v.fuel_type}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 col-span-2">
                    <Gauge size={14} className="text-gray-400" />
                    <span>Kilometraje: <strong className="text-primary font-mono">{v.current_mileage.toLocaleString()} km</strong></span>
                  </div>

                  <div className="flex items-center gap-2 col-span-2 text-gold-dark bg-gold/5 p-2 rounded-xl border border-gold/10">
                    <Settings size={14} />
                    <span>Próximo Aceite: <strong className="font-mono">{v.next_oil_change_mileage.toLocaleString()} km</strong></span>
                  </div>

                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="px-3 py-1.5 bg-gold/10 text-gold-dark hover:bg-gold/20 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Edit3 size={13} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  Retirar
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
          title={editingVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
          size="md"
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            
            <Input
              label="Placa del Vehículo"
              placeholder="MBA-1234"
              maxLength={10}
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              disabled={!!editingVehicle} // Lock plate in edit
            />

            <Input
              label="Marca"
              placeholder="Ej. Toyota"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />

            <Input
              label="Modelo"
              placeholder="Ej. Hilux CD 4x4"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />

            <Input
              label="Año de Fabricación"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />

            <Input
              label="Color"
              placeholder="Ej. Blanco / Plateado"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            />

            <div className="form-group">
              <label className="form-label" htmlFor="fuel-select">Tipo de Combustible</label>
              <select
                id="fuel-select"
                className="form-input"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                required
              >
                <option value="diesel">Diésel</option>
                <option value="extra">Extra</option>
                <option value="super">Súper</option>
              </select>
            </div>

            <Input
              label="Kilometraje Actual (km)"
              type="number"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
              required
            />

            <Input
              label="Próximo Cambio de Aceite (km)"
              type="number"
              value={nextOilChangeMileage}
              onChange={(e) => setNextOilChangeMileage(e.target.value)}
              required
            />

            <div className="form-group md:col-span-2">
              <label className="form-label" htmlFor="status-select">Estado Operativo</label>
              <select
                id="status-select"
                className="form-input"
                value={operationalStatus}
                onChange={(e) => setOperationalStatus(e.target.value)}
                required
              >
                <option value="disponible">Disponible (En Patio)</option>
                <option value="en_viaje">En Viaje</option>
                <option value="en_taller">En Taller</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 md:col-span-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gold"
                isLoading={saving}
              >
                Guardar Vehículo
              </Button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
};

export default AdminVehiclesPage;
