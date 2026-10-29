import { useState, useEffect, FC, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, RotateCw } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { useAuth } from '../../../hooks/useAuth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, verifyLoginOtp, resendLoginOtp, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
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

  // Bước 1: Gửi credentials -> Nhận yêu cầu nhập 2FA OTP
  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError('Please fill in both email and password');
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.requiresLoginOtp) {
        setStep('otp');
        setCooldown(60);
        setOtp('');
        setSuccessMsg('A 6-digit verification code has been sent to your email.');
      }
    } catch {
      // Error handled in AuthContext
    }
  };

  // Bước 2: Xác thực mã 2FA OTP
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setFormError('Please enter the 6-digit code');
      return;
    }

    try {
      await verifyLoginOtp(email.trim(), cleanOtp);
    } catch {
      // Error handled in AuthContext
    }
  };

  // Gửi lại mã 2FA OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setFormError(null);
    setSuccessMsg(null);
    clearError();

    try {
      await resendLoginOtp(email.trim());
      setCooldown(60);
      setSuccessMsg('A new verification code has been sent to your email.');
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
          BƯỚC 1: NHẬP EMAIL & MẬT KHẨU
          =================================================================== */}
      {step === 'credentials' && (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="alex@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
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
            autoComplete="current-password"
          />

          <div className="flex items-center justify-end -mt-1">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline transition-colors cursor-pointer"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="navy"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 group bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md active:scale-98 transition-all"
          >
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
          </Button>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              New to Skipli Canvas?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-[#0B192C] hover:text-amber-700 underline underline-offset-4 cursor-pointer transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
        </form>
      )}

      {/* ===================================================================
          BƯỚC 2: XÁC THỰC 2FA LOGIN OTP
          =================================================================== */}
      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4 animate-fadeIn">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              Two-Factor Authentication: We sent a 6-digit login code to <strong className="font-semibold">{email}</strong>. Valid for 5 minutes.
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
            <span>Verify & Enter Workspace</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
          </Button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setOtp('');
                setFormError(null);
              }}
              className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to sign in
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
    </div>
  );
};
