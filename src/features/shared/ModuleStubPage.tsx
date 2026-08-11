import { NAV_ITEMS } from '../../config/navigation';
import { useLocation } from 'react-router-dom';

type Props = {
  title?: string;
  description?: string;
};

/**
 * Pantalla operativa de módulo aún sin API completa.
 * Mantiene IA, copy y estados vacíos accesibles (usabilidad).
 */
export default function ModuleStubPage({ title, description }: Props) {
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((n) => n.path === pathname);

  const heading = title ?? item?.label ?? 'Módulo';
  const body =
    description ??
    item?.description ??
    'Este módulo forma parte del flujo institucional y se conectará al API.';

  return (
    <section className="module-page" aria-labelledby="module-title">
      <header className="module-header">
        <p className="module-kicker">{item?.module ?? 'Módulo'}</p>
        <h1 id="module-title">{heading}</h1>
        <p className="module-lead">{body}</p>
      </header>

      <div className="module-panel" role="status">
        <h2>Estado del módulo</h2>
        <p>
          La interfaz y reglas de negocio de este módulo ya están definidas para
          tu clase de usuario. La persistencia completa se activará cuando el
          endpoint correspondiente esté disponible en el servidor institucional.
        </p>
        <ul className="module-checklist">
          <li>Navegación y permisos por rol: activos</li>
          <li>Contraste, foco y etiquetas: aplicados en el shell</li>
          <li>Integración API: en cola según prioridad del flujo</li>
        </ul>
      </div>
    </section>
  );
}
