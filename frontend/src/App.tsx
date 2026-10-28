import { FC, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { WorkspacePreviewPage } from './pages/WorkspacePreviewPage';
import { StandalonePreviewPage } from './pages/StandalonePreviewPage';
import { LoadingScreen } from './components/ui/LoadingScreen';

const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              {/* 1. Auth Page */}
              <Route
                path="/auth"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicOnlyRoute>
                    <ResetPasswordPage />
                  </PublicOnlyRoute>
                }
              />

              {/* 2. Home Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <WorkspacePreviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <WorkspacePreviewPage />
                  </ProtectedRoute>
                }
              />

              {/* 3. Workspace Editor with session or new project */}
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <WorkspacePreviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/:sessionId"
                element={
                  <ProtectedRoute>
                    <WorkspacePreviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/:sessionId/:tab"
                element={
                  <ProtectedRoute>
                    <WorkspacePreviewPage />
                  </ProtectedRoute>
                }
              />

              {/* 4. Standalone Fullscreen Preview */}
              <Route
                path="/preview/:sessionId"
                element={
                  <ProtectedRoute>
                    <StandalonePreviewPage />
                  </ProtectedRoute>
                }
              />

              {/* 5. Fallback Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
