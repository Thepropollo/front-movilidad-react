import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import RoleRoute from './components/RoleRoute';
import { LoginPage, RegisterPage } from '@features/auth';
import {
  ChecklistDigitalPage,
  DriverFuelTicketsPage,
  PendingFeedbackBanner,
  RequestFormPage,
  TripEvaluationPage,
  TeacherLiquidationPage,
  TransportAuditPanelPage,
} from '@features/requests';
import { RectorPanelPage } from '@features/rector';
import { TransportPanelPage } from '@features/transport';
import { WorkshopPanelPage } from '@features/workshop';
import RoleHomePage from '@features/shared/RoleHomePage';
import {
  AgendaPage,
  AuthorizePage,
  ConductorNoveltyPage,
  ConductorPaymentsPage,
  ConductorRouteMapPage,
  ConductorTripsPage,
  ConductorVehiclePage,
  DisponibilidadPage,
  DocumentsHistoryPage,
  FleetDriversPage,
  FleetStatusPage,
  FleetVehiclesPage,
  FlujoPage,
  GasStationsPage,
  LubricantsPage,
  MapPage,
  MechanicHistoryPage,
  ParticipantsPage,
  ReassignPage,
  ReportsPage,
  StudentInvitationsPage,
  TripDetailPage,
} from '@features/modules';
import { homeForRoles } from './config/roles';

const allowRegister = import.meta.env.VITE_ALLOW_REGISTER === 'true';

function AppHome() {
  const { roleIds } = useAuth();
  return <Navigate to={homeForRoles(roleIds)} replace />;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <PendingFeedbackBanner />}
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <AppHome /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
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
                  subtitle="Eje central operativo de movilización."
                />
              }
            />
            <Route path="solicitudes" element={<TransportPanelPage />} />
            <Route path="asignar" element={<TransportPanelPage />} />
            <Route path="disponibilidad" element={<DisponibilidadPage />} />
            <Route path="flota/estado" element={<FleetStatusPage />} />
            <Route path="taller" element={<WorkshopPanelPage />} />
            <Route path="economico" element={<TransportAuditPanelPage />} />
            <Route path="documentos" element={<ChecklistDigitalPage />} />
            <Route path="participantes" element={<ParticipantsPage />} />
            <Route path="autorizar" element={<AuthorizePage />} />
            <Route path="flujo" element={<FlujoPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="reasignar" element={<ReassignPage />} />
            <Route path="flota/conductores" element={<FleetDriversPage />} />
            <Route path="flota/vehiculos" element={<FleetVehiclesPage />} />
            <Route path="gasolineras" element={<GasStationsPage />} />
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
                  subtitle="Ejecute viajes y reporte su unidad."
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
          </Route>

          <Route path="mecanico" element={<RoleRoute roles={['mecanico']} />}>
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['mecanico']}
                  title="Panel de Mantenimiento"
                  subtitle="Órdenes, inspecciones y lubricantes."
                />
              }
            />
            <Route path="ordenes" element={<WorkshopPanelPage />} />
            <Route path="inspeccion" element={<ChecklistDigitalPage />} />
            <Route path="lubricantes" element={<LubricantsPage />} />
            <Route path="historial" element={<MechanicHistoryPage />} />
          </Route>

          <Route path="docente" element={<RoleRoute roles={['docente']} />}>
            <Route
              index
              element={
                <RoleHomePage
                  focusRoles={['docente']}
                  title="Panel Docente"
                  subtitle="Solicite, invite participantes y liquide."
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
                  subtitle="Supervise viajes de su unidad."
                />
              }
            />
            <Route path="solicitudes" element={<DocumentsHistoryPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
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
                  subtitle="Apruebe viajes externos."
                />
              }
            />
            <Route path="pendientes" element={<RectorPanelPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
            <Route path="documentos" element={<DocumentsHistoryPage />} />
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
                  subtitle="Confirme participación y califique viajes."
                />
              }
            />
            <Route path="evaluar" element={<TripEvaluationPage />} />
            <Route path="invitaciones" element={<StudentInvitationsPage />} />
            <Route path="flujo" element={<FlujoPage />} />
            <Route path="detalle" element={<TripDetailPage />} />
            <Route path="historial" element={<DocumentsHistoryPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
