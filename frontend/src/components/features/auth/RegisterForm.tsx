import { useState, FC, FormEvent } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { useAuth } from '../../../hooks/useAuth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !password) {
      setFormError('Please fill in both email and password');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(email, password, displayName);
    } catch {
      // Handled in AuthContext
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {(error || formError) && (
        <Alert type="error" message={error || formError} />
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="John Doe"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        leftIcon={<UserIcon className="w-4 h-4 text-navy-400" />}
      />

      <Input
        label="Email"
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="w-4 h-4 text-navy-400" />}
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4 text-navy-400" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-navy-400 hover:text-navy-700 focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        required
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="gold"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-2 group"
      >
        <span>Create Account</span>
        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
      </Button>

      <div className="pt-3 text-center">
        <p className="text-xs text-navy-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-navy-950 hover:text-gold-600 underline underline-offset-4 cursor-pointer transition-colors"
          >
            Sign in now
          </button>
        </p>
      </div>
    </form>
  );
};
