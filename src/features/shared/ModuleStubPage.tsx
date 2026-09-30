import { NAV_ITEMS } from '../../config/navigation';
import { useLocation } from 'react-router-dom';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import { ShieldCheck, Layers, Cpu, Compass, CalendarDays, FileText } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
};

/**
 * Pantalla operativa de módulo en desarrollo o extensión institucional.
 */
export default function ModuleStubPage({ title, description }: Props) {
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((n) => n.path === pathname);

  const heading = title ?? item?.label ?? 'Módulo Institucional';
  const body =
    description ??
    item?.description ??
    'Este módulo forma parte del ecosistema operativo de transporte y movilidad ULEAM.';

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6" aria-labelledby="module-title">
      <HeroMetricCard
        badge={item?.module ?? 'Módulo en Expansión'}
        badgeVariant="indigo"
        title={heading}
        description={body}
        metricValue="PROT"
        metricLabel="ESTADO DEL MÓDULO"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Navegación y Permisos"
          value="ACTIVO"
          tone="ok"
          icon={<ShieldCheck size={18} />}
          hint="Control RBAC verificado"
        />
        <StatCard
          label="Capa de Interfaz"
          value="COMPLETA"
          tone="ok"
          icon={<Layers size={18} />}
          hint="Diseño y accesibilidad WCAG"
        />
        <StatCard
          label="Contratos de API"
          value="EN COLA"
          tone="warn"
          icon={<Cpu size={18} />}
          hint="Endpoints de persistencia"
        />
        <StatCard
          label="Disponibilidad"
          value="FASE 2"
          tone="neutral"
          icon={<Compass size={18} />}
          hint="Siguiente iteración del sprint"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Panel Principal"
          description="Retorne al panel de control y resúmenes de su perfil."
          icon={<Compass size={20} />}
          href="/app/dashboard"
        />
        <ResourceCard
          title="Agenda de Flota"
          description="Consulte la programación de viajes y disponibilidad vehicular."
          icon={<CalendarDays size={20} />}
          href="/app/secretaria/agenda"
        />
        <ResourceCard
          title="Documentos Normativos"
          description="Descargue reglamentos, protocolos y manuales de usuario."
          icon={<FileText size={20} />}
          href="/app/documentos"
        />
      </div>

      <div className="module-panel shadow-sm border border-zinc-200 rounded-xl p-5" role="status">
        <h2 className="text-base font-bold font-mono text-zinc-900 mb-2">Arquitectura y Reglas del Módulo</h2>
        <p className="ops-muted text-xs font-mono leading-relaxed mb-4">
          La interfaz y reglas de negocio de este módulo ya están definidas para su clase de usuario. La persistencia completa se activará cuando el endpoint correspondiente esté desplegado en el servidor institucional.
        </p>
        <ul className="text-xs font-mono text-zinc-700 space-y-2 list-disc pl-5">
          <li>Navegación, guards de autenticación y permisos por rol: <strong>activos</strong>.</li>
          <li>Contraste, foco visual y etiquetas semánticas: <strong>aplicados en el shell</strong>.</li>
          <li>Integración con API RESTful: <strong>en cola según prioridad del flujo operativo</strong>.</li>
        </ul>
      </div>
    </section>
  );
}
