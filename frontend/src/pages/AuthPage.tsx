import { useState, FC } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/features/auth/LoginForm';
import { RegisterForm } from '../components/features/auth/RegisterForm';

export const AuthPage: FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <AuthLayout mode={mode} onSwitchMode={setMode}>
      <div key={mode} className="animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
            {mode === 'login'
              ? 'Sign in to access your AI web builder workspace and projects'
              : 'Start crafting production-ready websites with AI assistance'}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs min-h-[360px] sm:min-h-[390px] flex flex-col justify-center">
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </AuthLayout>
  );
};
