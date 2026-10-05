import { useState, FC } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/features/auth/LoginForm';
import { RegisterForm } from '../components/features/auth/RegisterForm';

export const AuthPage: FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <AuthLayout
      title={mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản mới'}
      subtitle={
        mode === 'login'
          ? 'Chào mừng bạn quay trở lại với Skipli Canvas AI Web Builder'
          : 'Bắt đầu biến ý tưởng thành website hoàn chỉnh trong vài giây với AI'
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
