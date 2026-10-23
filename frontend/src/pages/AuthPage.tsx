import { useState, FC } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/features/auth/LoginForm';
import { RegisterForm } from '../components/features/auth/RegisterForm';
import { cn } from '../utils/cn';

export const AuthPage: FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <AuthLayout mode={mode} onSwitchMode={setMode}>
      {/* PowerPoint-style Slide Viewport */}
      <div className="relative w-full overflow-hidden">
        <div
          className={cn(
            'flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            mode === 'login' ? 'translate-x-0' : '-translate-x-1/2'
          )}
        >
          {/* Slide 1: Sign In */}
          <div
            className={cn(
              'w-1/2 shrink-0 pr-3 transition-all duration-500',
              mode === 'login'
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-30 scale-95 pointer-events-none'
            )}
          >
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Sign in to access your AI web builder workspace and projects
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs min-h-[390px] flex flex-col justify-center">
              <LoginForm onSwitchToRegister={() => setMode('register')} />
            </div>
          </div>

          {/* Slide 2: Create Account */}
          <div
            className={cn(
              'w-1/2 shrink-0 pl-3 transition-all duration-500',
              mode === 'register'
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-30 scale-95 pointer-events-none'
            )}
          >
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
                Create Account
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Start crafting production-ready websites with AI assistance
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs min-h-[390px] flex flex-col justify-center">
              <RegisterForm onSwitchToLogin={() => setMode('login')} />
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
