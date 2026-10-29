import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.config';
import { userRepository } from '../repositories/user.repository';
import { emailVerificationRepository } from '../repositories/email-verification.repository';
import { User } from '../models/user.model';
import { AuthUserPayload, TokenPair } from '../types/auth.types';
import {
  RequestRegisterOtpDTO,
  VerifyRegisterOtpDTO,
  SetCredentialsDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  UpdateProfileDTO,
  ChangePasswordWithOtpDTO,
  VerifyLoginOtpDTO,
  ResendLoginOtpDTO,
  AuthResultWithTokens,
  UserResponseDTO,
  LoginResult
} from '../dtos/auth.dto';
import { emailService } from './email.service';

interface HttpError extends Error {
  status?: number;
}

function createHttpError(message: string, status: number): HttpError {
  const err: HttpError = new Error(message);
  err.status = status;
  return err;
}

export class AuthService {
  private accessSecret: Secret = env.jwtAccessSecret;
  private refreshSecret: Secret = env.jwtRefreshSecret;

  /**
   * Bước 1 Register: Người dùng nhập email -> Kiểm tra trùng lặp -> Lưu OTP vào collection email_verifications -> Gửi email
   */
  async requestRegisterOtp(dto: RequestRegisterOtpDTO): Promise<{ message: string; email: string }> {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser && existingUser.passwordHash) {
      throw createHttpError('Email already registered. Please sign in.', 400);
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Lưu mã OTP vào collection riêng biệt (email_verifications), định danh bằng chính email
    await emailVerificationRepository.saveOtp(email, otpHash, expiresAt);

    console.log('\n======================================================');
    console.log('✉️ [REGISTER EMAIL OTP]');
    console.log(`Recipient: ${email}`);
    console.log(`Code: ${otpCode}`);
    console.log(`Expires in: 10 minutes`);
    console.log('======================================================\n');

    try {
      await emailService.sendEmailVerificationOtp(email, email.split('@')[0], otpCode, 10);
    } catch (err) {
      console.warn('[AuthService Warning] Failed to dispatch registration OTP email via SMTP, dev code logged above.');
    }

    return {
      message: 'Verification code sent to your email.',
      email
    };
  }

  /**
   * Bước 2 Register: Người dùng nhập OTP -> So khớp trong collection email_verifications
   * Nếu đúng: Tiêu hủy OTP record, TẠO USER MỚI vào collection users, cấp Token và chuyển hướng
   */
  async verifyRegisterOtp(dto: VerifyRegisterOtpDTO): Promise<AuthResultWithTokens & { isProfileComplete: boolean }> {
    const email = dto.email.toLowerCase().trim();

    const record = await emailVerificationRepository.findByEmail(email);
    if (!record) {
      throw createHttpError('No verification code requested or code has expired. Please request a new code.', 400);
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      throw createHttpError('Verification code has expired. Please request a new code.', 400);
    }

    const inputHash = crypto.createHash('sha256').update(dto.otp.trim()).digest('hex');
    if (inputHash !== record.otpHash) {
      throw createHttpError('Invalid verification code.', 400);
    }

    // Tiêu hủy mã OTP khỏi collection email_verifications
    await emailVerificationRepository.deleteByEmail(email);

    // Tạo User chính thức trong collection users (hoặc lấy user nếu đã tồn tại)
    let user = await userRepository.findByEmail(email);
    if (!user) {
      const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newUser: User = {
        id,
        email,
        displayName: email.split('@')[0],
        passwordHash: null,
        isEmailVerified: true,
        createdAt: now,
        updatedAt: now
      };
      await userRepository.create(newUser);
      user = newUser;
    } else {
      await userRepository.update(user.id, { isEmailVerified: true });
    }

    const tokens = this.generateTokenPair({ id: user.id, email: user.email, displayName: user.displayName });
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await userRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isProfileComplete: !!user.passwordHash
    };
  }

  /**
   * Bước 3 Register: Chuyển hướng sang màn hình thiết lập Tên hiển thị và Mật khẩu
   */
  async setCredentials(userId: string, dto: SetCredentialsDTO): Promise<UserResponseDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createHttpError('User not found', 404);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const updatedUser = await userRepository.update(userId, {
      displayName: dto.displayName.trim(),
      passwordHash
    });

    if (!updatedUser) {
      throw createHttpError('Failed to set profile and password', 500);
    }

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Đăng nhập Bước 1: Kiểm tra tài khoản & mật khẩu -> Sinh Login OTP 2FA (5 phút)
   */
  async login(dto: LoginDTO): Promise<LoginResult> {
    const email = dto.email.toLowerCase().trim();

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw createHttpError('Invalid email or password', 401);
    }

    if (!user.passwordHash) {
      throw createHttpError('Account has not set a password yet. Please complete setting up your account.', 400);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw createHttpError('Invalid email or password', 401);
    }

    if (user.isEmailVerified === false) {
      throw createHttpError('Please verify your email address before logging in.', 403);
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await userRepository.saveLoginOtp(user.id, otpHash, expiresAt);

    console.log('\n======================================================');
    console.log('🔐 [LOGIN 2FA OTP]');
    console.log(`Recipient: ${user.email} (${user.displayName})`);
    console.log(`Code: ${otpCode}`);
    console.log(`Expires in: 5 minutes`);
    console.log('======================================================\n');

    try {
      await emailService.sendLoginOtpEmail(user.email, user.displayName, otpCode, 5);
    } catch (err) {
      console.warn('[AuthService Warning] Failed to dispatch login OTP email via SMTP, dev code logged above.');
    }

    return {
      requiresLoginOtp: true,
      email: user.email
    };
  }

  /**
   * Đăng nhập Bước 2: Xác thực Login OTP 2FA -> Cấp cặp token
   */
  async verifyLoginOtp(dto: VerifyLoginOtpDTO): Promise<AuthResultWithTokens> {
    const email = dto.email.toLowerCase().trim();
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw createHttpError('User not found', 404);
    }

    if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
      throw createHttpError('No login verification in progress. Please log in again.', 400);
    }

    if (new Date(user.loginOtpExpiresAt).getTime() < Date.now()) {
      throw createHttpError('Login verification code has expired. Please log in again.', 400);
    }

    const inputHash = crypto.createHash('sha256').update(dto.otp.trim()).digest('hex');
    if (inputHash !== user.loginOtpHash) {
      throw createHttpError('Invalid verification code.', 400);
    }

    await userRepository.clearLoginOtp(user.id);

    const tokens = this.generateTokenPair({ id: user.id, email: user.email, displayName: user.displayName });
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await userRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async resendLoginOtp(dto: ResendLoginOtpDTO): Promise<void> {
    const email = dto.email.toLowerCase().trim();
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return;
    }

    if (user.isEmailVerified === false) {
      throw createHttpError('Please verify your email address first.', 403);
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await userRepository.saveLoginOtp(user.id, otpHash, expiresAt);

    console.log('\n======================================================');
    console.log('🔐 [RESEND LOGIN 2FA OTP]');
    console.log(`Recipient: ${user.email} (${user.displayName})`);
    console.log(`Code: ${otpCode}`);
    console.log(`Expires in: 5 minutes`);
    console.log('======================================================\n');

    try {
      await emailService.sendLoginOtpEmail(user.email, user.displayName, otpCode, 5);
    } catch (err) {
      console.warn('[AuthService Warning] Failed to dispatch login OTP email via SMTP, dev code logged above.');
    }
  }

  async refreshTokens(refreshTokenStr: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshTokenStr, this.refreshSecret) as AuthUserPayload;

      const user = await userRepository.findById(decoded.id);
      if (!user || !user.refreshTokenHash) {
        throw createHttpError('Invalid or revoked refresh token', 401);
      }

      const isRefreshValid = await bcrypt.compare(refreshTokenStr, user.refreshTokenHash);
      if (!isRefreshValid) {
        throw createHttpError('Invalid or revoked refresh token', 401);
      }

      const newTokens = this.generateTokenPair({ id: user.id, email: user.email, displayName: user.displayName });

      const newRefreshTokenHash = await bcrypt.hash(newTokens.refreshToken, 10);
      await userRepository.updateRefreshToken(user.id, newRefreshTokenHash);

      return newTokens;
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) {
        throw err;
      }
      throw createHttpError('Invalid or expired refresh token', 401);
    }
  }

  async logout(userId: string): Promise<void> {
    await userRepository.updateRefreshToken(userId, null);
  }

  async requestPasswordReset(dto: ForgotPasswordDTO): Promise<void> {
    const email = dto.email.toLowerCase().trim();
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const durationMinutes = parseInt(env.passwordResetTokenExpiresIn, 10) || 15;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    await userRepository.savePasswordResetToken(user.id, tokenHash, expiresAt);

    try {
      await emailService.sendPasswordResetEmail(user.email, user.displayName, rawToken);
    } catch (emailErr) {
      console.warn('[AuthService Warning] Failed to dispatch email via SMTP. Dev link was printed above.');
    }
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');
    const user = await userRepository.findByResetTokenHash(tokenHash);

    if (!user) {
      throw createHttpError('Invalid or expired password reset link', 400);
    }

    if (!user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt).getTime() < Date.now()) {
      throw createHttpError('Password reset link has expired', 400);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await userRepository.update(user.id, {
      passwordHash,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
      refreshTokenHash: null
    });
  }

  async getUserProfile(userId: string): Promise<UserResponseDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createHttpError('User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  async updateUserProfile(userId: string, dto: UpdateProfileDTO): Promise<UserResponseDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createHttpError('User not found', 404);
    }

    const updatedUser = await userRepository.update(userId, {
      displayName: dto.displayName.trim()
    });

    if (!updatedUser) {
      throw createHttpError('Failed to update user profile', 500);
    }

    return this.sanitizeUser(updatedUser);
  }

  async requestPasswordChangeOtp(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createHttpError('User not found', 404);
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await userRepository.savePasswordChangeOtp(userId, otpHash, expiresAt);

    console.log('\n======================================================');
    console.log('🔑 [PASSWORD CHANGE OTP]');
    console.log(`Recipient: ${user.email} (${user.displayName})`);
    console.log(`Code: ${otpCode}`);
    console.log(`Expires in: 10 minutes`);
    console.log('======================================================\n');

    try {
      await emailService.sendEmailVerificationOtp(user.email, user.displayName, otpCode, 10);
    } catch (err) {
      console.warn('[AuthService Warning] Failed to dispatch OTP email via SMTP, dev code logged above.');
    }
  }

  async verifyOtpAndChangePassword(userId: string, dto: ChangePasswordWithOtpDTO): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createHttpError('User not found', 404);
    }

    if (!user.passwordChangeOtpHash || !user.passwordChangeOtpExpiresAt) {
      throw createHttpError('No password change request found. Please request a verification code first.', 400);
    }

    if (new Date(user.passwordChangeOtpExpiresAt).getTime() < Date.now()) {
      throw createHttpError('Verification code has expired. Please request a new code.', 400);
    }

    const inputOtpHash = crypto.createHash('sha256').update(dto.otp.trim()).digest('hex');
    if (inputOtpHash !== user.passwordChangeOtpHash) {
      throw createHttpError('Invalid verification code.', 400);
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await userRepository.update(userId, {
      passwordHash: newPasswordHash,
      passwordChangeOtpHash: null,
      passwordChangeOtpExpiresAt: null,
      refreshTokenHash: null
    });
  }

  verifyAccessToken(token: string): AuthUserPayload {
    try {
      return jwt.verify(token, this.accessSecret) as AuthUserPayload;
    } catch {
      throw createHttpError('Invalid or expired access token', 401);
    }
  }

  private generateTokenPair(payload: AuthUserPayload): TokenPair {
    const accessOptions: SignOptions = { expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'] };
    const refreshOptions: SignOptions = { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] };

    const accessToken = jwt.sign(
      { id: payload.id, email: payload.email, displayName: payload.displayName },
      this.accessSecret,
      accessOptions
    );

    const refreshToken = jwt.sign(
      { id: payload.id, email: payload.email, displayName: payload.displayName },
      this.refreshSecret,
      refreshOptions
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User): UserResponseDTO {
    const {
      passwordHash,
      refreshTokenHash,
      resetPasswordTokenHash,
      resetPasswordExpiresAt,
      passwordChangeOtpHash,
      passwordChangeOtpExpiresAt,
      loginOtpHash,
      loginOtpExpiresAt,
      ...sanitized
    } = user;

    return {
      ...sanitized,
      isEmailVerified: user.isEmailVerified !== false,
      hasPassword: !!passwordHash
    };
  }
}

export const authService = new AuthService();
