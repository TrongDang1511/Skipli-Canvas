import { FC } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { WorkspacePreviewPage } from './pages/WorkspacePreviewPage';
import { LoadingScreen } from './components/ui/LoadingScreen';

const MainApp: FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <WorkspacePreviewPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <MainApp />
      </SessionProvider>
    </AuthProvider>
  );
}
