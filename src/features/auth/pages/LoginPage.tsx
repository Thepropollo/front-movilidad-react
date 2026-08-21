import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ULEAM_DOMAINS = ['uleam.edu.ec', 'live.uleam.edu.ec'];

const ENABLE_DEMO = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const ALLOW_REGISTER = import.meta.env.VITE_ALLOW_REGISTER === 'true';

const DEMO_ACCOUNTS = [
  { role: 'Secretaría', email: 'secretaria@uleam.edu.ec' },
  { role: 'Docente', email: 'docente@uleam.edu.ec' },
  { role: 'Vicerrector', email: 'vicerrector@uleam.edu.ec' },
  { role: 'Conductor', email: 'conductor1@uleam.edu.ec' },
  { role: 'Mecánico', email: 'mecanico@uleam.edu.ec' },
  { role: 'Dual C+M', email: 'conductor.mecanico@uleam.edu.ec' },
  { role: 'Facultad', email: 'decano@uleam.edu.ec' },
  { role: 'Estudiante', email: 'estudiante@test.com' },
] as const;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ssoNotice, setSsoNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSsoNotice(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Credenciales inválidas.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setError(null);
    setSsoNotice(null);
  };

  const handleUleamSso = () => {
    setError(null);
    setSsoNotice(
      'En el servidor institucional el acceso usará Microsoft Entra ID (cuenta ULEAM / @live.uleam.edu.ec). En este entorno de desarrollo usa el login local con usuarios seed.'
    );
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-header">
        <h1 className="auth-logo">ULEAM Movilidad</h1>
        <p className="auth-subtitle">
          Sistema de movilización institucional · Universidad Laica Eloy Alfaro
          de Manabí
        </p>
      </div>

      <div className="glass-panel auth-card">
        <h2 style={{ marginBottom: '8px', fontWeight: 600 }}>Iniciar sesión</h2>
        <p className="auth-hint">
          Dominios institucionales:{' '}
          {ULEAM_DOMAINS.map((d) => `@${d}`).join(' · ')}
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}
        {ssoNotice && (
          <div className="alert alert-info" role="status">
            <span>{ssoNotice}</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-uleam-sso"
          onClick={handleUleamSso}
        >
          Entrar con cuenta ULEAM
        </button>

        <div className="auth-divider" aria-hidden>
          <span>o acceso local de prueba</span>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo institucional
            </label>
            <div className="input-container">
              <User className="input-icon" size={18} aria-hidden />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="usuario@uleam.edu.ec"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className="input-container">
              <Lock className="input-icon" size={18} aria-hidden />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '10px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Iniciando sesión…</span>
            ) : (
              <>
                <LogIn size={18} aria-hidden />
                <span>Ingresar</span>
              </>
            )}
          </button>
        </form>

        {ENABLE_DEMO && (
          <div className="auth-demo-roles" aria-label="Cuentas demo por rol">
            <p className="auth-demo-hint">
              Solo entorno de prueba (no usar en producción)
            </p>
            <div className="auth-demo-grid">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="auth-demo-chip"
                  onClick={() => fillDemo(account.email)}
                  disabled={isSubmitting}
                >
                  {account.role}
                </button>
              ))}
            </div>
          </div>
        )}

        {ALLOW_REGISTER && (
          <p
            style={{
              marginTop: '20px',
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
