import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import RoleRoute from './components/RoleRoute';
import RoleHomePage from '@features/shared/RoleHomePage';
import NotFoundPage from '@features/shared/NotFoundPage';
import { homeForRoles } from './config/roles';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'));
const ChecklistDigitalPage = lazy(() => import('@features/requests/pages/ChecklistDigitalPage'));
const DriverFuelTicketsPage = lazy(() => import('@features/requests/pages/DriverFuelTicketsPage'));
const GasStationDispatcherPage = lazy(() => import('@features/requests/pages/GasStationDispatcherPage'));
const PendingFeedbackBanner = lazy(() => import('@features/requests/components/PendingFeedbackBanner'));
const RequestFormPage = lazy(() => import('@features/requests/pages/RequestFormPage'));
const TripEvaluationPage = lazy(() => import('@features/requests/pages/TripEvaluationPage'));
const TeacherLiquidationPage = lazy(() => import('@features/requests/pages/TeacherLiquidationPage'));
const TransportAuditPanelPage = lazy(() => import('@features/requests/pages/TransportAuditPanelPage'));
const RectorPanelPage = lazy(() => import('@features/rector/pages/RectorPanelPage'));
const TransportPanelPage = lazy(() => import('@features/transport/pages/TransportPanelPage'));
const WorkshopPanelPage = lazy(() => import('@features/workshop/pages/WorkshopPanelPage'));
const AgendaPage = lazy(() => import('@features/modules/pages/AgendaPage'));
const AuthorizePage = lazy(() => import('@features/modules/pages/AuthorizePage'));
const ConductorTripsPage = lazy(() => import('@features/modules/pages/ConductorTripsPage'));
const ConductorRouteMapPage = lazy(() => import('@features/modules/pages/ConductorRouteMapPage'));
const DisponibilidadPage = lazy(() => import('@features/modules/pages/DisponibilidadPage'));
const FleetDriversPage = lazy(() => import('@features/modules/pages/FleetDriversPage'));
const FleetStatusPage = lazy(() => import('@features/modules/pages/FleetStatusPage'));
const FleetVehiclesPage = lazy(() => import('@features/modules/pages/FleetVehiclesPage'));
const FlujoPage = lazy(() => import('@features/modules/pages/FlujoPage'));
const GasStationsPage = lazy(() => import('@features/modules/pages/GasStationsPage'));
const MapPage = lazy(() => import('@features/modules/pages/MapPage'));
const ParticipantsPage = lazy(() => import('@features/modules/pages/ParticipantsPage'));
const ReassignPage = lazy(() => import('@features/modules/pages/ReassignPage'));
const ReportsPage = lazy(() => import('@features/modules/pages/ReportsPage'));
const InstitutionalDocumentsPage = lazy(() => import('@features/modules/pages/InstitutionalDocumentsPage'));
const RateConfigurationPage = lazy(() => import('@features/modules/pages/RateConfigurationPage'));
const StudentInvitationsPage = lazy(() => import('@features/modules/pages/StudentInvitationsPage'));
const ConductorNoveltyPage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.ConductorNoveltyPage }))
);
const ConductorPaymentsPage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.ConductorPaymentsPage }))
);
const ConductorVehiclePage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.ConductorVehiclePage }))
);
const DocumentsHistoryPage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.DocumentsHistoryPage }))
);
const LubricantsPage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.LubricantsPage }))
);
const MechanicHistoryPage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.MechanicHistoryPage }))
);
const TripDetailPage = lazy(() =>
  import('@features/modules/pages/ConductorOpsPages').then((module) => ({ default: module.TripDetailPage }))
);

const allowRegister = import.meta.env.VITE_ALLOW_REGISTER === 'true';

function AppHome() {
  const { roleIds } = useAuth();
  return <Navigate to={homeForRoles(roleIds)} replace />;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense
      fallback={
        <div className="app-loading" role="status" aria-live="polite">
          Cargando pantalla…
        </div>
      }
    >
      {isAuthenticated && <PendingFeedbackBanner />}
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <AppHome /> : <LoginPage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <AppHome /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={
            allowRegister ? <RegisterPage /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/app"
          element={
            <RoleRoute
              roles={[
                'secretaria',
                'conductor',
                'mecanico',
                'docente',
                'responsable_facultad',
                'vicerrector',
                'estudiante',
              ]}
            >
              <AppShell />
            </RoleRoute>
          }
        >
          <Route index element={<AppHome />} />

          <Route
            path="secretaria"
            element={<RoleRoute roles={['secretaria']} />}
          >
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['secretaria']}
                  title="Panel de Secretaría"
                  subtitle="Planifique, asigne y controle la flota institucional."
                />
              }
            />
            <Route path="solicitudes" element={<TransportPanelPage />} />
            <Route path="asignar" element={<TransportPanelPage />} />
            <Route path="disponibilidad" element={<DisponibilidadPage />} />
            <Route path="flota/estado" element={<FleetStatusPage />} />
            <Route path="taller" element={<WorkshopPanelPage />} />
            <Route path="economico" element={<TransportAuditPanelPage />} />
            <Route path="tarifas" element={<RateConfigurationPage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
            <Route path="participantes" element={<ParticipantsPage />} />
            <Route path="autorizar" element={<AuthorizePage />} />
            <Route path="flujo" element={<FlujoPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="reasignar" element={<ReassignPage />} />
            <Route path="flota/conductores" element={<FleetDriversPage />} />
            <Route path="flota/vehiculos" element={<FleetVehiclesPage />} />
            <Route path="gasolineras" element={<GasStationsPage />} />
            <Route
              path="combustible/despacho"
              element={<GasStationDispatcherPage />}
            />
            <Route path="mapa" element={<MapPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="inspeccion" element={<ChecklistDigitalPage />} />
          </Route>

          <Route path="conductor" element={<RoleRoute roles={['conductor']} />}>
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['conductor']}
                  title="Panel del Conductor"
                  subtitle="Acepte el viaje, recorra la ruta y reporte la unidad."
                />
              }
            />
            <Route path="combustible" element={<DriverFuelTicketsPage />} />
            <Route path="viajes" element={<ConductorTripsPage />} />
            <Route path="hoja-ruta" element={<ConductorRouteMapPage />} />
            <Route path="mapa" element={<ConductorRouteMapPage />} />
            <Route path="pagos" element={<ConductorPaymentsPage />} />
            <Route path="novedades" element={<ConductorNoveltyPage />} />
            <Route path="vehiculo" element={<ConductorVehiclePage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
          </Route>

          <Route path="mecanico" element={<RoleRoute roles={['mecanico']} />}>
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['mecanico']}
                  title="Panel de Mantenimiento"
                  subtitle="Mantenimiento preventivo y correctivo de la flota."
                />
              }
            />
            <Route path="ordenes" element={<WorkshopPanelPage />} />
            <Route path="inspeccion" element={<ChecklistDigitalPage />} />
            <Route path="lubricantes" element={<LubricantsPage />} />
            <Route path="historial" element={<MechanicHistoryPage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
            <Route path="reportes" element={<ReportsPage />} />
          </Route>

          <Route path="docente" element={<RoleRoute roles={['docente']} />}>
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['docente']}
                  title="Panel Docente"
                  subtitle="Solicite el vehículo, siga el trámite y conserve el PDF."
                />
              }
            />
            <Route path="solicitar" element={<RequestFormPage />} />
            <Route path="liquidar" element={<TeacherLiquidationPage />} />
            <Route path="evaluar" element={<TripEvaluationPage />} />
            <Route path="participantes" element={<ParticipantsPage />} />
            <Route path="flujo" element={<FlujoPage />} />
            <Route path="seguimiento" element={<TripDetailPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
            <Route path="mapa" element={<MapPage />} />
            <Route path="reportes" element={<ReportsPage />} />
          </Route>

          <Route
            path="facultad"
            element={<RoleRoute roles={['responsable_facultad']} />}
          >
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['responsable_facultad']}
                  title="Panel de Facultad"
                  subtitle="Solicite en línea y siga el trámite de su facultad."
                />
              }
            />
            <Route path="solicitar" element={<RequestFormPage />} />
            <Route path="solicitudes" element={<DocumentsHistoryPage />} />
            <Route path="seguimiento" element={<FlujoPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
            <Route path="mapa" element={<MapPage />} />
            <Route path="reportes" element={<ReportsPage />} />
          </Route>

          <Route
            path="vicerrector"
            element={<RoleRoute roles={['vicerrector']} />}
          >
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['vicerrector']}
                  title="Panel Vicerrector"
                  subtitle="Autorice viajes externos y deje constancia digital."
                />
              }
            />
            <Route path="pendientes" element={<RectorPanelPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
            <Route path="mapa" element={<MapPage />} />
            <Route path="reportes" element={<ReportsPage />} />
          </Route>

          <Route
            path="estudiante"
            element={<RoleRoute roles={['estudiante']} />}
          >
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['estudiante']}
                  title="Panel Estudiante"
                  subtitle="Confirme si viaja y consulte el servicio asignado."
                />
              }
            />
            <Route path="evaluar" element={<TripEvaluationPage />} />
            <Route path="invitaciones" element={<StudentInvitationsPage />} />
            <Route path="flujo" element={<FlujoPage />} />
            <Route path="detalle" element={<TripDetailPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
            <Route path="documentos" element={<InstitutionalDocumentsPage />} />
            <Route path="mapa" element={<MapPage />} />
          </Route>
        </Route>

        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route
          path="/solicitar"
          element={<Navigate to="/app/docente/solicitar" replace />}
        />
        <Route
          path="/rectorado"
          element={<Navigate to="/app/vicerrector/pendientes" replace />}
        />
        <Route
          path="/transporte"
          element={<Navigate to="/app/secretaria/asignar" replace />}
        />
        <Route
          path="/taller"
          element={<Navigate to="/app/mecanico/ordenes" replace />}
        />
        <Route
          path="/mis-vales"
          element={<Navigate to="/app/conductor/combustible" replace />}
        />
        <Route
          path="/liquidar"
          element={<Navigate to="/app/docente/liquidar" replace />}
        />
        <Route
          path="/auditar-liquidaciones"
          element={<Navigate to="/app/secretaria/economico" replace />}
        />
        <Route
          path="/inspeccion"
          element={<Navigate to="/app/mecanico/inspeccion" replace />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
