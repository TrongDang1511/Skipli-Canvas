export interface PasswordStrengthResult {
  score: number; // 0 (empty), 1 (Weak), 2 (Fair), 3 (Good), 4 (Strong)
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | '';
  barColor: string;
  textColor: string;
  hasMinLength: boolean;
  isRecommendedLength: boolean;
  hasMixedCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hint: string;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: '',
      barColor: 'bg-slate-200',
      textColor: 'text-slate-400',
      hasMinLength: false,
      isRecommendedLength: false,
      hasMixedCase: false,
      hasNumber: false,
      hasSymbol: false,
      hint: '',
    };
  }

  const hasMinLength = password.length >= 6;
  const isRecommendedLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  // Mật khẩu dưới 6 ký tự luôn là Weak
  if (!hasMinLength) {
    return {
      score: 1,
      label: 'Weak',
      barColor: 'bg-red-500',
      textColor: 'text-red-600',
      hasMinLength: false,
      isRecommendedLength: false,
      hasMixedCase,
      hasNumber,
      hasSymbol,
      hint: 'At least 6 characters required',
    };
  }

  // Khi đã đạt từ 6 ký tự trở lên: Tính điểm từ 1 đến 4
  let score = 1; // 1 điểm cơ sở vì đã >= 6 ký tự
  if (isRecommendedLength) score += 1; // +1 nếu >= 8 ký tự
  if ((hasLetters && hasNumber) || hasSymbol) score += 1; // +1 nếu kết hợp chữ và số hoặc có ký tự đặc biệt
  if (hasMixedCase && hasNumber && hasSymbol) score += 1; // +1 nếu hội tụ đủ mọi yếu tố gồm chữ hoa-thường, số VÀ ký tự đặc biệt

  score = Math.min(Math.max(score, 1), 4);

  switch (score) {
    case 1:
      return {
        score: 1,
        label: 'Weak',
        barColor: 'bg-red-500',
        textColor: 'text-red-600',
        hasMinLength,
        isRecommendedLength,
        hasMixedCase,
        hasNumber,
        hasSymbol,
        hint: 'Add mixed case letters or numbers',
      };
    case 2:
      return {
        score: 2,
        label: 'Fair',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-600',
        hasMinLength,
        isRecommendedLength,
        hasMixedCase,
        hasNumber,
        hasSymbol,
        hint: 'Add symbols or 8+ characters',
      };
    case 3:
      return {
        score: 3,
        label: 'Good',
        barColor: 'bg-blue-600',
        textColor: 'text-blue-600',
        hasMinLength,
        isRecommendedLength,
        hasMixedCase,
        hasNumber,
        hasSymbol,
        hint: 'Good password! Add symbols for max security',
      };
    case 4:
    default:
      return {
        score: 4,
        label: 'Strong',
        barColor: 'bg-emerald-600',
        textColor: 'text-emerald-600',
        hasMinLength,
        isRecommendedLength,
        hasMixedCase,
        hasNumber,
        hasSymbol,
        hint: 'Great password!',
      };
  }
}
