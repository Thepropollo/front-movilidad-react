import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Edit3, Trash2, CheckCircle, AlertTriangle, Mail, CreditCard, Lock } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { 
  fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, fetchRoles,
  type User, type Role 
} from '../api/admin_crud';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Filter states
  const [search, setSearch] = useState<string>('');
  const [faculty, setFaculty] = useState<string>('');

  // Form Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form fields
  const [nationalId, setNationalId] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [facultyInstitution, setFacultyInstitution] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async (targetPage: number = page) => {
    try {
      setLoading(true);
      const [res, rolesData] = await Promise.all([
        fetchAdminUsers({ search: search || undefined, faculty: faculty || undefined, page: targetPage }),
        fetchRoles()
      ]);
      setUsers(res.data);
      setPage(res.current_page);
      setTotalPages(res.last_page);
      setTotalUsers(res.total);
      setRoles(rolesData);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData(1);
  }, [faculty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(1);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNationalId('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setFacultyInstitution('');
    setRoleId(roles[0]?.id.toString() || '');
    setIsActive(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setNationalId(user.national_id);
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setEmail(user.email);
    setPassword(''); // keep blank to not change
    setFacultyInstitution(user.faculty_institution);
    setRoleId(user.role_id.toString());
    setIsActive(user.is_active);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload: any = {
      national_id: nationalId,
      first_name: firstName,
      last_name: lastName,
      email,
      faculty_institution: facultyInstitution,
      role_id: Number(roleId),
      is_active: isActive
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingUser) {
        const res = await updateAdminUser(editingUser.id, payload);
        setSuccessMsg(res.message);
      } else {
        const res = await createAdminUser(payload);
        setSuccessMsg(res.message);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al guardar los datos del usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar o desactivar este usuario?')) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteAdminUser(id);
      setSuccessMsg(res.message);
      loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al intentar eliminar el usuario.');
    }
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <Users className="text-secondary-brand" size={28} />
            Gestión de Personal Universitario
          </h1>
          <p className="text-muted mt-1">Administra usuarios, asigna roles de acceso y controla los estados activos en la plataforma.</p>
        </div>
        <Button
          type="button"
          variant="gold"
          onClick={handleOpenCreate}
          icon={<UserPlus size={16} />}
        >
          Nuevo Usuario
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

      {/* Filter bar */}
      <div className="glass-panel p-6 bg-white/5 dark:bg-slate-800/40 mb-8">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Input
            label="Buscar por Cédula o Apellidos"
            placeholder="Cédula, nombre, apellido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />

          <div className="form-group">
            <label className="form-label" htmlFor="faculty-filter">Filtrar por Facultad</label>
            <select
              id="faculty-filter"
              className="form-input"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
            >
              <option value="">-- Todas las Facultades --</option>
              <option value="FACULTAD DE CIENCIAS INFORMATICAS">FACULTAD DE CIENCIAS INFORMÁTICAS</option>
              <option value="FACULTAD DE INGENIERIA CIVIL">FACULTAD DE INGENIERÍA CIVIL</option>
              <option value="DIRECCIÓN DE TRANSPORTE Y MOVILIDAD">DIRECCIÓN DE TRANSPORTE Y MOVILIDAD</option>
              <option value="RECTORADO ULEAM">RECTORADO ULEAM</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="gold"
              isLoading={loading}
              icon={<Search size={16} />}
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setFaculty('');
                setPage(1);
                setLoading(true);
                fetchAdminUsers({ page: 1 }).then(res => {
                  setUsers(res.data);
                  setPage(res.current_page);
                  setTotalPages(res.last_page);
                  setTotalUsers(res.total);
                  setLoading(false);
                });
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="spinner mb-4" style={{ width: '36px', height: '36px' }}></div>
          <p className="text-muted text-xs">Cargando lista de usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50/50">
          <Users className="text-gray-300 mb-2 mx-auto" size={44} />
          <p className="font-semibold text-gray-500 text-sm">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/75 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Cédula</th>
                  <th scope="col" className="px-6 py-3.5">Nombres y Apellidos</th>
                  <th scope="col" className="px-6 py-3.5">Facultad / Institución</th>
                  <th scope="col" className="px-6 py-3.5">Rol de Sistema</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Estado</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="bg-transparent border-b border-slate-100 dark:border-slate-800/40 last:border-0 hover:bg-blue-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                      {item.national_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{item.last_name}, {item.first_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold capitalize max-w-xs truncate">
                      {item.faculty_institution.toLowerCase()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary-brand uppercase">
                      {item.role?.description || item.role?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        item.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 bg-gold/10 text-gold-dark hover:bg-gold/20 rounded-lg transition"
                        title="Editar Usuario"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Eliminar/Desactivar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 select-none">
            <span className="text-xs text-gray-500">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> (Total: <strong>{totalUsers}</strong> usuarios)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                disabled={page === 1}
                onClick={() => {
                  const target = page - 1;
                  setPage(target);
                  loadData(target);
                }}
              >
                Anterior
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                disabled={page === totalPages}
                onClick={() => {
                  const target = page + 1;
                  setPage(target);
                  loadData(target);
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration/Edition Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          size="md"
        >
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            
            <Input
              label="Cédula de Identidad"
              placeholder="13xxxxxxx (10 dígitos)"
              maxLength={10}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              icon={<CreditCard size={16} />}
            />

            <Input
              label="Correo Institucional"
              type="email"
              placeholder="usuario@uleam.edu.ec"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail size={16} />}
            />

            <Input
              label="Nombres Completos"
              placeholder="Ej. Juan Andrés"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <Input
              label="Apellidos Completos"
              placeholder="Ej. Cevallos Mera"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <Input
              label={editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
              type="password"
              placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              icon={<Lock size={16} />}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="role-select">Rol asignado</label>
              <select
                id="role-select"
                className="form-input"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.description || r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label" htmlFor="faculty-select">Facultad / Institución de origen</label>
              <select
                id="faculty-select"
                className="form-input"
                value={facultyInstitution}
                onChange={(e) => setFacultyInstitution(e.target.value)}
                required
              >
                <option value="">Seleccione Facultad...</option>
                <option value="FACULTAD DE CIENCIAS INFORMATICAS">FACULTAD DE CIENCIAS INFORMÁTICAS</option>
                <option value="FACULTAD DE INGENIERIA CIVIL">FACULTAD DE INGENIERÍA CIVIL</option>
                <option value="DIRECCIÓN DE TRANSPORTE Y MOVILIDAD">DIRECCIÓN DE TRANSPORTE Y MOVILIDAD</option>
                <option value="RECTORADO ULEAM">RECTORADO ULEAM</option>
              </select>
            </div>

            {editingUser && (
              <div className="form-group md:col-span-2 flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is-active-check"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-gold border-gray-300 focus:ring-gold"
                />
                <label htmlFor="is-active-check" className="text-xs font-bold text-primary cursor-pointer select-none">
                  Usuario Activo (Permite iniciar sesión y firmar solicitudes)
                </label>
              </div>
            )}

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
                Guardar Usuario
              </Button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
};

export default AdminUsersPage;
