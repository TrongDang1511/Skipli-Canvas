import { FC, useState, useEffect, FormEvent, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  RotateCw,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  updateProfileApi,
  requestPasswordOtpApi,
  verifyOtpAndChangePasswordApi
} from '../../../services/auth.api';
import { PasswordStrengthMeter } from '../../ui/PasswordStrengthMeter';
import { cn } from '../../../utils/cn';

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'security';
}

export const ProfileSettingsModal: FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile'
}) => {
  const { user, updateUserDisplayName } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>(initialTab);

  // Tab 1: Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Tab 2: Security & Password State
  const [securityStep, setSecurityStep] = useState<'request' | 'verify' | 'success'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState<string | null>(null);
  const [securityErrorMsg, setSecurityErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Đồng bộ displayName khi user thay đổi hoặc modal mở ra
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);
      setSecurityErrorMsg(null);
      setSecuritySuccessMsg(null);
    }
  }, [isOpen, user]);

  // Bộ đếm ngược thời gian gửi lại OTP (Cooldown 60s)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user || typeof document === 'undefined') return null;

  // Xử lý cập nhật Tên hiển thị
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileErrorMsg('Display name cannot be empty');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const updatedUser = await updateProfileApi({ displayName: trimmed });
      updateUserDisplayName(updatedUser.displayName);
      setProfileSuccessMsg('Profile updated successfully');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileErrorMsg(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Xử lý gửi mã OTP đổi mật khẩu về Email
  const handleRequestOtp = async () => {
    setIsSendingOtp(true);
    setSecurityErrorMsg(null);
    setSecuritySuccessMsg(null);

    try {
      const msg = await requestPasswordOtpApi();
      setSecurityStep('verify');
      setSecuritySuccessMsg(msg);
      setResendCooldown(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code';
      setSecurityErrorMsg(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Xử lý xác nhận OTP và đổi mật khẩu mới
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSecurityErrorMsg(null);

    if (otp.trim().length !== 6) {
      setSecurityErrorMsg('Verification code must be exactly 6 digits');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityErrorMsg('Passwords do not match');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await verifyOtpAndChangePasswordApi({
        otp: otp.trim(),
        newPassword
      });
      setSecurityStep('success');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setSecurityErrorMsg(message);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Khởi tạo lại trạng thái bảo mật
  const handleResetSecurityFlow = () => {
    setSecurityStep('request');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityErrorMsg(null);
    setSecuritySuccessMsg(null);
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recently';

  const avatarInitial = (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase();

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl my-auto bg-white dark:bg-[#0B192C] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp text-slate-900 dark:text-stone-100 z-10"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-[#FAF9F6] dark:bg-[#070F1E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-[#D4AF37] font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B192C] dark:text-white">
                Account & Security Settings
              </h2>
              <p className="text-xs text-slate-600 dark:text-stone-300">
                Manage your personal profile and security credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-stone-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (2 Tabs Chuẩn Light & Luxurious) */}
        <div className="px-6 pt-3 bg-white dark:bg-[#0B192C] border-b border-slate-200 dark:border-slate-800 flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center gap-2 pb-3 text-xs font-bold transition-all relative cursor-pointer',
              activeTab === 'profile'
                ? 'text-[#0B192C] dark:text-[#D4AF37]'
                : 'text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white'
            )}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile Information</span>
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#D4AF37] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex items-center gap-2 pb-3 text-xs font-bold transition-all relative cursor-pointer',
              activeTab === 'security'
                ? 'text-[#0B192C] dark:text-[#D4AF37]'
                : 'text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Password (2FA)</span>
            {activeTab === 'security' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#D4AF37] rounded-full" />
            )}
          </button>
        </div>

        {/* Nội dung Modal cuộn được */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          {/* ===================== TAB 1: PROFILE INFORMATION ===================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Thẻ User Avatar & Tóm tắt */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#070F1E] border border-slate-200/90 dark:border-slate-800">
                <div className="w-14 h-14 rounded-full bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-[#D4AF37] flex items-center justify-center text-xl font-extrabold shrink-0 shadow-inner">
                  {avatarInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.displayName || 'Creator'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-stone-300 truncate font-mono">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-stone-300 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                    <span>Member since {formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Thông báo cập nhật profile thành công / lỗi */}
              {profileSuccessMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              {/* Form Cập nhật Display Name (CHỈ DUY NHẤT TRƯỜNG NÀY ĐƯỢC PHÉP CHỈNH SỬA) */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                      <span>Full Name (Display Name)</span>
                      <span className="text-amber-600 dark:text-[#D4AF37] font-semibold text-[11px]">(Editable)</span>
                    </label>
                    <span className="text-[11px] text-slate-600 dark:text-stone-300">
                      {displayName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    maxLength={50}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070F1E] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs placeholder:text-slate-400"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-stone-300">
                    This name will be displayed in your project workspace, collaboration invites, and header.
                  </p>
                </div>

                {/* Trường Email (CHỈ ĐỌC - READ ONLY) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400" />
                      <span>Primary Email</span>
                    </label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/50">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 text-xs font-mono text-slate-600 dark:text-stone-400 cursor-not-allowed select-all"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-stone-300 italic">
                    For security reasons, your email address is permanently bound to this account and cannot be modified.
                  </p>
                </div>

                {/* Nút Lưu Cập Nhật */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile || displayName.trim() === user.displayName}
                    className={cn(
                      'px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95',
                      isUpdatingProfile || displayName.trim() === user.displayName
                        ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-70'
                        : 'bg-[#0B192C] hover:bg-[#1E3E62] dark:bg-[#1E3E62] dark:hover:bg-[#28507e] border border-[#0B192C] dark:border-slate-700'
                    )}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================== TAB 2: SECURITY & PASSWORD (2FA FLOW) ===================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Thông báo lỗi bảo mật */}
              {securityErrorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{securityErrorMsg}</span>
                </div>
              )}

              {/* BƯỚC 1: CHƯA YÊU CẦU MÃ OTP (INITIAL STATE) */}
              {securityStep === 'request' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 flex gap-3.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Two-Factor Email Verification Required
                      </h4>
                      <p className="text-slate-600 dark:text-stone-300 leading-relaxed font-sans">
                        To maintain high-grade security, password changes require a 6-digit one-time verification code sent directly to your email (<strong>{user.email}</strong>).
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-stone-400 font-sans">
                        This guarantees that unauthorized individuals sitting at your workstation cannot modify your password without email authorization.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#070F1E] border border-slate-200/90 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-stone-200">
                      <KeyRound className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
                      <span>Password Security Standard</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 dark:text-stone-300 space-y-1.5 list-disc list-inside">
                      <li>Minimum 6 characters required.</li>
                      <li>Encrypted using industry-standard bcrypt one-way hashing.</li>
                      <li>Changing password automatically signs out all sessions across other devices.</li>
                    </ul>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSendingOtp}
                      className={cn(
                        'px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95',
                        isSendingOtp
                          ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed'
                          : 'bg-[#0B192C] hover:bg-[#1E3E62] dark:bg-[#1E3E62] dark:hover:bg-[#28507e] border border-[#0B192C]'
                      )}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating & Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Send Verification Code to My Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: ĐÃ GỬI OTP -> NHẬP 6 SỐ VÀ ĐẶT MẬT KHẨU MỚI */}
              {securityStep === 'verify' && (
                <form onSubmit={handleChangePassword} className="space-y-5 animate-fadeIn">
                  {/* Banner hướng dẫn */}
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-900 dark:text-blue-200">
                          {securitySuccessMsg || 'Verification code sent!'}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 text-[11px]">
                          Check <strong>{user.email}</strong> for your 6-digit code. Valid for 10 minutes.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSendingOtp}
                      onClick={handleRequestOtp}
                      className={cn(
                        'text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer',
                        resendCooldown > 0
                          ? 'text-slate-400 dark:text-stone-500 cursor-not-allowed'
                          : 'text-amber-600 hover:text-amber-700 dark:text-[#D4AF37] hover:underline'
                      )}
                    >
                      <RotateCw className={cn('w-3 h-3', isSendingOtp && 'animate-spin')} />
                      <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}</span>
                    </button>
                  </div>

                  {/* Nhập 6 số OTP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-stone-200 mb-1.5">
                      6-Digit Verification Code (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070F1E] text-center font-mono text-lg font-bold tracking-[0.4em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs placeholder:text-slate-300"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Nhập Mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-stone-200 mb-1.5">
                      New Password (Minimum 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070F1E] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs placeholder:text-slate-400"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Thanh đo độ mạnh mật khẩu */}
                    <PasswordStrengthMeter password={newPassword} />
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-stone-200 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070F1E] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-2xs placeholder:text-slate-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetSecurityFlow}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-stone-300 dark:hover:text-white transition cursor-pointer"
                    >
                      Cancel & Start Over
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isSubmittingPassword ||
                        otp.length !== 6 ||
                        newPassword.length < 6 ||
                        newPassword !== confirmPassword
                      }
                      className={cn(
                        'px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95',
                        isSubmittingPassword ||
                        otp.length !== 6 ||
                        newPassword.length < 6 ||
                        newPassword !== confirmPassword
                          ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-70'
                          : 'bg-[#0B192C] hover:bg-[#1E3E62] dark:bg-[#1E3E62] dark:hover:bg-[#28507e] border border-[#0B192C]'
                      )}
                    >
                      {isSubmittingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying & Changing...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Confirm & Change Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* BƯỚC 3: ĐỔI MẬT KHẨU THÀNH CÔNG */}
              {securityStep === 'success' && (
                <div className="py-6 text-center space-y-4 animate-scaleUp">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Password Changed Successfully!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-stone-300 max-w-sm mx-auto leading-relaxed font-sans">
                      Your new password is now active. For security, all other active sessions on other devices have been automatically signed out.
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleResetSecurityFlow();
                        setActiveTab('profile');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] dark:bg-[#1E3E62] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Back to Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
