import { useState, FC, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { forgotPasswordApi } from '../services/auth.api';

export const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your work email address');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordApi(trimmedEmail);
      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process request. Please try again later.');
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
          {!isSubmitted ? (
            /* State 1: Input Form */
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight">
                  Reset Password
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Enter your email address and we'll send you a secure link to reset your account password.
                </p>
              </div>

              {error && <Alert type="error" message={error} />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                  autoFocus
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="navy"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full mt-2 group bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md active:scale-98 transition-all"
                >
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 text-[#D4AF37]" />
                </Button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B192C] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* State 2: Success Confirmation */
            <div className="text-center py-2 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#0B192C]">
                  Check Your Email
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  If an account exists for <strong className="text-[#0B192C] font-semibold">{email}</strong>, you will receive password reset instructions shortly.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Didn't receive an email?</p>
                <p>• Check your spam, junk, or promotions folder.</p>
                <p>• The reset link remains valid for 15 minutes.</p>
              </div>

              <div className="pt-2">
                <Link to="/auth" className="block w-full">
                  <Button
                    type="button"
                    variant="navy"
                    size="lg"
                    className="w-full bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-md"
                  >
                    Return to Sign In
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
