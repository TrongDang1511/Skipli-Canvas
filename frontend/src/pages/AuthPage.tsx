import { useState, FC } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/features/auth/LoginForm';
import { RegisterForm } from '../components/features/auth/RegisterForm';

export const AuthPage: FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <AuthLayout
      title={mode === 'login' ? 'Sign In' : 'Create an Account'}
      subtitle={
        mode === 'login'
          ? 'Welcome back to Skipli Canvas AI Web Builder'
          : 'Turn your ideas into production-ready websites in seconds with AI'
      }
    >
      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode('login')} />
      )}
    </AuthLayout>
  );
};
