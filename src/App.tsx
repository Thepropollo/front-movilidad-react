import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { LoginPage, RegisterPage } from '@features/auth';
import { DashboardPage } from '@features/dashboard';
import { RequestFormPage, ChecklistDigitalPage, DriverFuelTicketsPage, GasStationDispatcherPage, TeacherLiquidationPage, TransportAuditPanelPage, PendingFeedbackBanner } from '@features/requests';
import { RectorPanelPage } from '@features/rector';
import { TransportPanelPage } from '@features/transport';
import { WorkshopPanelPage } from '@features/workshop';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <PendingFeedbackBanner />}
      <Routes>
        {/* Redirección inicial basada en autenticación */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas Protegidas bajo Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitar"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RequestFormPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rectorado"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RectorPanelPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transporte"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TransportPanelPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspeccion"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ChecklistDigitalPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/taller"
          element={
            <ProtectedRoute>
              <MainLayout>
                <WorkshopPanelPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-vales"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DriverFuelTicketsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gasolinera"
          element={
            <ProtectedRoute>
              <MainLayout>
                <GasStationDispatcherPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/liquidar"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TeacherLiquidationPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditar-liquidaciones"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TransportAuditPanelPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
