import { useState, useEffect, FC, FormEvent } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, KeyRound, Sparkles, ArrowLeft, RotateCw } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { PasswordStrengthMeter } from '../../ui/PasswordStrengthMeter';
import { useAuth } from '../../../hooks/useAuth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { requestRegisterOtp, verifyRegisterOtp, setCredentials, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<'email' | 'otp' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Bước 1: Gửi mã OTP đăng ký
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Please enter your work email');
      return;
    }

    try {
      await requestRegisterOtp(email.trim());
      setStep('otp');
      setCooldown(60);
      setSuccessMsg('Verification code sent to your email.');
    } catch {
      // Error handled in AuthContext
    }
  };

  // Bước 2: Xác thực mã OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setFormError('Please enter the 6-digit verification code');
      return;
    }

    try {
      const result = await verifyRegisterOtp(email.trim(), cleanOtp);
      if (result.isProfileComplete) {
        // Đã hoàn thiện hồ sơ trước đó
      } else {
        setStep('profile');
      }
    } catch {
      // Error handled in AuthContext
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    try {
      await requestRegisterOtp(email.trim());
      setCooldown(60);
      setSuccessMsg('A new verification code has been sent to your email.');
    } catch {
      // Error handled in AuthContext
    }
  };

  // Bước 3: Thiết lập Tên hiển thị và Mật khẩu hoàn thiện
  const handleSetCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!displayName.trim()) {
      setFormError('Please enter your full name');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await setCredentials(displayName.trim(), password);
    } catch {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="w-full">
      {(error || formError) && (
        <div className="mb-4">
          <Alert type="error" message={error || formError || ''} />
        </div>
      )}

      {successMsg && (
        <div className="mb-4">
          <Alert type="success" message={successMsg} />
        </div>
      )}

      {/* ===================================================================
          BƯỚC 1: NHẬP EMAIL ĐĂNG KÝ
          =================================================================== */}
      {step === 'email' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="sarah@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
            autoComplete="email"
            autoFocus
          />

          <Button
            type="submit"
            variant="navy"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 group bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md active:scale-98 transition-all"
          >
            <span>Continue with Email</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
          </Button>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-[#0B192C] hover:text-amber-700 underline underline-offset-4 cursor-pointer transition-colors"
              >
                Sign in now
              </button>
            </p>
          </div>
        </form>
      )}

      {/* ===================================================================
          BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ
          =================================================================== */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              We sent a 6-digit verification code to <strong className="font-semibold">{email}</strong>. Valid for 10 minutes.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full h-13 text-center font-mono text-2xl font-bold tracking-[0.4em] bg-slate-50 border border-slate-300 rounded-xl focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all text-slate-900"
              autoFocus
              required
            />
          </div>

          <Button
            type="submit"
            variant="navy"
            size="lg"
            isLoading={isLoading}
            disabled={otp.length !== 6}
            className="w-full mt-2 group bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md active:scale-98 transition-all"
          >
            <span>Verify & Continue</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
          </Button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setFormError(null);
              }}
              className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Change email
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || isLoading}
              className={`inline-flex items-center font-medium transition-colors ${
                cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-amber-700 hover:text-amber-800 cursor-pointer'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================
          BƯỚC 3: THIẾT LẬP TÊN HIỂN THỊ & MẬT KHẨU
          =================================================================== */}
      {step === 'profile' && (
        <form onSubmit={handleSetCredentials} className="space-y-4 animate-fadeIn">
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#1E3E62] shrink-0 mt-0.5" />
            <div className="text-xs text-[#0B192C] leading-relaxed">
              Email verified! Complete your profile credentials to access your workspace.
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder="Sarah Chen"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
            required
            autoFocus
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
            autoComplete="new-password"
          />

          <PasswordStrengthMeter password={password} />

          <Button
            type="submit"
            variant="navy"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 group bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md active:scale-98 transition-all"
          >
            <span>Complete & Enter Workspace</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
          </Button>
        </form>
      )}
    </div>
  );
};
