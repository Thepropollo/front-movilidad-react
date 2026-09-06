import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Building,
  CreditCard,
  UserCheck,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    national_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    faculty_institution: 'FACULTAD DE CIENCIAS INFORMATICAS',
    role_name: 'docente',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(formData);
      navigate('/app');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error durante el registro. Por favor intente de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper auth-register">
      <div className="auth-header" style={{ marginBottom: '24px' }}>
        <h1 className="auth-logo">ULEAM Movilidad</h1>
        <p className="auth-subtitle">
          Alta de docente o estudiante (sin roles privilegiados)
        </p>
      </div>

      <div className="glass-panel auth-card" style={{ padding: '32px' }}>
        <h2 style={{ marginBottom: '20px', fontWeight: 600 }}>
          Registro de Usuario
        </h2>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="first_name">
                Nombres
              </label>
              <div className="input-container">
                <User className="input-icon" size={18} />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Juan"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="last_name">
                Apellidos
              </label>
              <div className="input-container">
                <User className="input-icon" size={18} />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Pérez"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="national_id">
                Cédula
              </label>
              <div className="input-container">
                <CreditCard className="input-icon" size={18} />
                <input
                  id="national_id"
                  name="national_id"
                  type="text"
                  className="form-input"
                  placeholder="0000000000"
                  value={formData.national_id}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="phone_number">
                Teléfono (Opcional)
              </label>
              <div className="input-container">
                <span
                  className="input-icon"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  +593
                </span>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  className="form-input"
                  placeholder="999999999"
                  // Handle phone_number from formData if it existed, for now let's just use national_id as placeholder since it's not in state
                  onChange={handleChange}
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="faculty_institution">
              Facultad / Institución
            </label>
            <div className="input-container">
              <Building className="input-icon" size={18} />
              <input
                id="faculty_institution"
                name="faculty_institution"
                type="text"
                className="form-input"
                placeholder="Ej. Facultad de Ciencias Informáticas"
                value={formData.faculty_institution}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="role_name">
              Rol en el Sistema
            </label>
            <div className="input-container">
              <Shield className="input-icon" size={18} />
              <select
                id="role_name"
                name="role_name"
                className="form-select"
                value={formData.role_name}
                onChange={handleChange}
                style={{ paddingLeft: '48px' }}
              >
                <option value="docente">Docente</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="email">
              Correo Institucional
            </label>
            <div className="input-container">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="ejemplo@uleam.edu.ec"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={10}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '24px' }}
          >
            {isSubmitting ? (
              <>
                <div
                  className="spinner"
                  style={{ width: '18px', height: '18px' }}
                ></div>
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <UserCheck size={18} />
                <span>Registrarse</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>¿Ya tienes una cuenta? </span>
          <Link to="/login" className="auth-link">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
