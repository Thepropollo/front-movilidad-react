import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BadgeCheck,
  Car,
  ClipboardPen,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ENABLE_DEMO = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const ALLOW_REGISTER = import.meta.env.VITE_ALLOW_REGISTER === 'true';

const DEMO_ACCOUNTS = [
  { role: 'Secretaría', email: 'secretaria@uleam.edu.ec' },
  { role: 'Docente', email: 'docente@uleam.edu.ec' },
  { role: 'Vicerrector', email: 'vicerrector@uleam.edu.ec' },
  { role: 'Conductor', email: 'conductor1@uleam.edu.ec' },
  { role: 'Mecánico', email: 'mecanico@uleam.edu.ec' },
  { role: 'Facultad', email: 'decano@uleam.edu.ec' },
  { role: 'Estudiante', email: 'e1314433382@live.uleam.edu.ec' },
] as const;

const REQUEST_STEPS = [
  {
    icon: ClipboardPen,
    label: 'Solicitar',
    text: 'Trámite digital, sin oficio en papel.',
  },
  {
    icon: BadgeCheck,
    label: 'Autorizar',
    text: 'Internas, externas y salidas próximas.',
  },
  {
    icon: Car,
    label: 'Asignar',
    text: 'Vehículo y conductor según disponibilidad.',
  },
  {
    icon: Wrench,
    label: 'Controlar',
    text: 'Flota, mantenimiento, combustible y reportes.',
  },
] as const;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ssoNotice, setSsoNotice] = useState<string | null>(null);
  const [authNotice] = useState(() => {
    try {
      const notice = sessionStorage.getItem('auth_notice');
      sessionStorage.removeItem('auth_notice');
      return notice;
    } catch {
      return null;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSsoNotice(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      let destination = '/app';
      try {
        const saved = sessionStorage.getItem('auth_redirect_to');
        sessionStorage.removeItem('auth_redirect_to');
        if (saved?.startsWith('/') && !saved.startsWith('//')) {
          destination = saved;
        }
      } catch {
        // Use the role-specific app home when browser storage is unavailable.
      }
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Correo o contraseña no válidos.'
      );
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

  return (
    <div className="login-page">
      <a className="skip-link" href="#login-form">
        Saltar al formulario
      </a>
      <header className="login-top">
        <div className="login-brandmark">
          <img
            src="/brand/logo-uleam-wordmark.png"
            alt="Universidad Laica Eloy Alfaro de Manabí"
            width={220}
            height={68}
          />
          <span>
            <strong>SIGMOV-ULEAM</strong>
            <small>Logística y movilidad de la flota vehicular</small>
          </span>
        </div>
      </header>

      <div className="login-layout">
        <section className="login-story" aria-labelledby="login-story-title">
          <img
            className="login-campus"
            src="/entrada-uleam.jpg"
            alt="Entrada principal del campus matriz de la ULEAM en Manta"
          />
          <div className="login-story-copy">
            <p className="login-kicker">Universidad Laica Eloy Alfaro de Manabí</p>
            <h1 id="login-story-title">Gestión de logística y movilidad</h1>
            <p className="login-lead">
              Plataforma web para planificar, asignar, trazar y reportar el uso
              de la flota institucional.
            </p>
            <ul className="login-ops">
              {REQUEST_STEPS.map((item) => (
                <li key={item.label}>
                  <item.icon size={18} aria-hidden />
                  <span>
                    <strong>{item.label}</strong>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <main className="login-card">
          <header className="login-card-head">
            <h2 id="login-title">Acceso institucional</h2>
            <p>Correo institucional @uleam.edu.ec. Un repositorio, todo el flujo.</p>
          </header>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {authNotice && (
            <div className="alert alert-info" role="status">
              {authNotice}
            </div>
          )}
          {ssoNotice && (
            <div className="alert alert-info" role="status">
              {ssoNotice}
            </div>
          )}

          <form
            id="login-form"
            className="login-form"
            onSubmit={(event) => void handleSubmit(event)}
            noValidate
            aria-labelledby="login-title"
          >
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Correo institucional
              </label>
              <div className="input-container">
                <Mail className="input-icon" size={18} aria-hidden />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="usuario@uleam.edu.ec"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isSubmitting}
                  aria-invalid={error ? true : undefined}
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
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-password"
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden />
                  ) : (
                    <Eye size={18} aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Verificando…'
              ) : (
                <>
                  <LogIn size={18} aria-hidden />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-uleam-sso"
            onClick={() =>
              setSsoNotice(
                'En el entorno institucional el ingreso se realiza con Microsoft Entra ID (cuenta ULEAM). En esta defensa se usa el acceso local con correo universitario.'
              )
            }
          >
            <UserRound size={18} aria-hidden />
            Ingresar con cuenta ULEAM
          </button>

          <p className="login-hint">
            Uso exclusivo de la comunidad universitaria. Dirección Administrativa
            / Transporte · Manta.
          </p>

          {ENABLE_DEMO && (
            <details className="login-demo">
              <summary>Cuentas de demostración académica</summary>
              <p>
                Rellenan el formulario con usuarios de prueba. Contraseña:{' '}
                <code>password</code>.
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
            </details>
          )}

          {ALLOW_REGISTER && (
            <p className="login-register">
              ¿Docente o estudiante nuevo?{' '}
              <Link to="/register">Solicitar alta</Link>
            </p>
          )}
        </main>
      </div>

      <footer className="login-foot">
        <p>Universidad Laica Eloy Alfaro de Manabí</p>
        <p>Circunvalación / Vía San Mateo · Manta, Manabí</p>
      </footer>
    </div>
  );
}
