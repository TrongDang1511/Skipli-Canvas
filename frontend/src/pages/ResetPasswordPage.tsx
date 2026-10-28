import { useState, useEffect, FC, FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { resetPasswordApi } from '../services/auth.api';

export const ResetPasswordPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Auto redirect to /auth after 3 seconds on success
  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/auth', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordApi({ token, newPassword });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. The link may have expired.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#FAF9F6] flex flex-col justify-between p-4 sm:p-8 font-sans text-[#0B192C] selection:bg-amber-100">
      {/* Top Header Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <Link to="/auth" className="flex items-center gap-2.5 select-none group">
          <img
            src="/Skipli_logo.png"
            alt="Skipli Logo"
            className="h-8 w-auto object-contain shrink-0 drop-shadow-2xs transition-transform group-hover:scale-105"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xl tracking-tight text-[#0B192C]">
              Skipli
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
              Canvas
            </span>
          </div>
        </Link>
      </header>

      {/* Main Container Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
          {!token ? (
            /* Error State: Missing Token */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-[#0B192C]">
                  Invalid Reset Link
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  This password reset link is invalid, incomplete, or has expired. Please request a new recovery link.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/forgot-password" className="block w-full">
                  <Button
                    type="button"
                    variant="navy"
                    size="lg"
                    className="w-full bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md"
                  >
                    Request New Link
                  </Button>
                </Link>
              </div>
            </div>
          ) : !isSuccess ? (
            /* State 1: Reset Password Form */
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight">
                  Set New Password
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Choose a new strong password for your Skipli Canvas account.
                </p>
              </div>

              {error && <Alert type="error" message={error} />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  autoFocus
                  autoComplete="new-password"
                />

                <PasswordStrengthMeter password={newPassword} />

                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="navy"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full mt-2 group bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md active:scale-98 transition-all"
                >
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
                </Button>
              </form>
            </div>
          ) : (
            /* State 2: Success Confirmation */
            <div className="text-center py-2 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#0B192C]">
                  Password Reset Complete
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your password has been successfully updated. All previous sessions have been signed out for security.
                </p>
              </div>

              <p className="text-xs text-slate-400">
                Redirecting to Sign In in <strong className="text-[#0B192C]">{countdown}s</strong>...
              </p>

              <div className="pt-2">
                <Link to="/auth" className="block w-full">
                  <Button
                    type="button"
                    variant="navy"
                    size="lg"
                    className="w-full bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md"
                  >
                    Sign In Now
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center py-4 text-xs text-slate-400 select-none">
        &copy; {new Date().getFullYear()} Skipli Canvas. All rights reserved.
      </footer>
    </div>
  );
};
