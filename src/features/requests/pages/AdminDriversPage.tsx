import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, CheckCircle, AlertTriangle, ShieldAlert, Trash2, Edit3, User, Calendar, CreditCard, Star, FileText } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { 
  fetchAdminDrivers, createAdminDriver, updateAdminDriver, deleteAdminDriver,
  type Driver 
} from '../api/admin_crud';
import { fetchAdminUsers, type User as SystemUser } from '../api/admin_crud';

const AdminDriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [choferUsers, setChoferUsers] = useState<SystemUser[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form fields
  const [userId, setUserId] = useState<string>('');
  const [contractType, setContractType] = useState<string>('LOSEP');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  
  // License fields
  const [licenseType, setLicenseType] = useState<string>('E');
  const [currentPoints, setCurrentPoints] = useState<string>('30');
  const [expirationDate, setExpirationDate] = useState<string>('');

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driversData, usersData] = await Promise.all([
        fetchAdminDrivers(),
        fetchAdminUsers({ paginate: false })
      ]);
      setDrivers(driversData);
      
      // Filter users who have the role name 'chofer'
      const filteredUsers = usersData.filter(u => u.role?.name === 'chofer');
      setChoferUsers(filteredUsers);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar choferes y licencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setUserId(choferUsers[0]?.id.toString() || '');
    setContractType('LOSEP');
    setIsAvailable(true);
    setLicenseType('E');
    setCurrentPoints('30');
    setExpirationDate('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setUserId(d.user_id.toString());
    setContractType(d.contract_type);
    setIsAvailable(d.is_available);
    
    const lic = d.licenses && d.licenses.length > 0 ? d.licenses[0] : null;
    setLicenseType(lic ? lic.license_type : 'E');
    setCurrentPoints(lic ? lic.current_points.toString() : '30');
    setExpirationDate(lic ? lic.expiration_date : '');
    
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      user_id: Number(userId),
      contract_type: contractType,
      is_available: isAvailable,
      license_type: licenseType.toUpperCase(),
      current_points: Number(currentPoints),
      expiration_date: expirationDate
    };

    try {
      if (editingDriver) {
        const res = await updateAdminDriver(editingDriver.id, payload);
        setSuccessMsg(res.message);
      } else {
        const res = await createAdminDriver(payload);
        setSuccessMsg(res.message);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al registrar chofer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de inhabilitar o eliminar este chofer del sistema?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteAdminDriver(id);
      setSuccessMsg(res.message);
      loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al intentar eliminar el chofer.');
    }
  };

  const isLicenseExpired = (expDate: string) => {
    if (!expDate) return false;
    return new Date(expDate) < new Date();
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <ShieldCheck className="text-secondary-brand" size={28} />
            Habilitación de Choferes y Licencias
          </h1>
          <p className="text-muted mt-1">Controla los contratos laborales de conductores y vigila las caducidades de puntos de licencias profesionales.</p>
        </div>
        <Button
          type="button"
          variant="gold"
          onClick={handleOpenCreate}
          disabled={choferUsers.length === 0}
          icon={<Plus size={16} />}
        >
          Habilitar Chofer
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
          <p className="text-muted text-xs">Cargando choferes...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-700/60 rounded-3xl p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <User className="text-gray-300 mb-2 mx-auto" size={44} />
          <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No hay choferes registrados en el sistema</p>
          <p className="text-muted text-xs max-w-sm mt-1 mx-auto">Para habilitar uno, primero asegúrate de registrar un usuario con rol 'chofer' en la pestaña de Usuarios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {drivers.map((d) => {
            const license = d.licenses && d.licenses.length > 0 ? d.licenses[0] : null;
            const expired = license ? isLicenseExpired(license.expiration_date) : false;

            return (
              <div key={d.id} className={`glass-panel p-6 flex flex-col justify-between transition-all ${
                expired ? 'border-red-600/30 bg-red-500/5 shadow-red-950/20' : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
              }`}>
                <div>
                  
                  {/* Blinking Red Expired warning banner */}
                  {expired && (
                    <div className="mb-4 bg-red-600 text-white text-[11px] font-black tracking-widest text-center py-2 px-3 rounded-xl animate-pulse flex items-center justify-center gap-1.5 uppercase">
                      <ShieldAlert size={14} />
                      LICENCIA CADUCADA - INHABILITADO PARA VIAJES
                    </div>
                  )}

                  {/* Header card details */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-left">
                      <h3 className="font-bold text-base text-primary">
                        {d.user?.last_name}, {d.user?.first_name}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{d.user?.email}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      d.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {d.is_available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>

                  {/* License and contract attributes */}
                  <div className="grid grid-cols-2 gap-4 py-4 my-2 border-t border-gray-100 text-xs text-muted">
                    
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span>Contrato: <strong className="text-primary font-mono">{d.contract_type}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-gray-400" />
                      <span>Licencia: <strong className="text-primary font-mono">{license ? license.license_type : 'N/A'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-gray-400" />
                      <span>Puntos: <strong className="text-primary font-mono">{license ? license.current_points : 30} pts</strong></span>
                    </div>

                    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${expired ? 'bg-red-100 text-red-800 font-bold' : ''}`}>
                      <Calendar size={14} className={expired ? 'text-red-700' : 'text-gray-400'} />
                      <span>Caduca: <strong>{license ? license.expiration_date : 'Sin registrar'}</strong></span>
                    </div>

                  </div>

                </div>

                {/* Card Actions */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="px-3 py-1.5 bg-gold/10 text-gold-dark hover:bg-gold/20 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Edit3 size={13} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    Retirar
                  </button>
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* Composite Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingDriver ? 'Editar Chofer Habilitado' : 'Habilitar Nuevo Chofer'}
          size="md"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-6 p-1 text-left">
            
            {/* Sección A: Chofer */}
            <div className="border-b border-gray-100 pb-5">
              <h3 className="text-xs font-black uppercase text-secondary-brand tracking-wider mb-4 flex items-center gap-1.5">
                <User size={15} />
                Sección A: Datos Laborales del Conductor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="form-group">
                  <label className="form-label" htmlFor="driver-user-select">Conductor (Usuario Rol Chofer)</label>
                  <select
                    id="driver-user-select"
                    className="form-input"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    disabled={!!editingDriver} // Lock in edit
                  >
                    {editingDriver ? (
                      <option value={editingDriver.user_id}>
                        {editingDriver.user?.last_name}, {editingDriver.user?.first_name}
                      </option>
                    ) : (
                      <>
                        <option value="">Seleccione Usuario...</option>
                        {choferUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.last_name}, {u.first_name} ({u.email})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contract-select">Régimen / Tipo de Contrato</label>
                  <select
                    id="contract-select"
                    className="form-input"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    required
                  >
                    <option value="LOSEP">LOSEP</option>
                    <option value="CODIGO_TRABAJO">Código de Trabajo</option>
                    <option value="contrato">Contrato Civil</option>
                    <option value="nombramiento">Nombramiento</option>
                  </select>
                </div>

                {editingDriver && (
                  <div className="form-group md:col-span-2 flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox"
                      id="driver-avail-check"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="rounded text-gold border-gray-300 focus:ring-gold"
                    />
                    <label htmlFor="driver-avail-check" className="text-xs font-bold text-primary cursor-pointer select-none">
                      Conductor Disponible para Asignación de Viajes
                    </label>
                  </div>
                )}

              </div>
            </div>

            {/* Sección B: Licencia */}
            <div>
              <h3 className="text-xs font-black uppercase text-secondary-brand tracking-wider mb-4 flex items-center gap-1.5">
                <CreditCard size={15} />
                Sección B: Datos de la Licencia Profesional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <Input
                  label="Tipo de Licencia"
                  placeholder="Ej. E, D, C1"
                  maxLength={5}
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  required
                />

                <Input
                  label="Puntos Actuales de Licencia"
                  type="number"
                  min="0"
                  max="30"
                  placeholder="Máximo 30"
                  value={currentPoints}
                  onChange={(e) => setCurrentPoints(e.target.value)}
                  required
                />

                <div className="md:col-span-2">
                  <Input
                    label="Fecha de Caducidad"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required
                  />
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 pt-4">
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
                Habilitar / Guardar
              </Button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
};

export default AdminDriversPage;
