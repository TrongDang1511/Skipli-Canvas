import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { authRateLimiter, forgotPasswordRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  RequestRegisterOtpSchema,
  VerifyRegisterOtpSchema,
  SetCredentialsSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
  ChangePasswordWithOtpSchema,
  VerifyLoginOtpSchema,
  ResendLoginOtpSchema,
} from '../dtos/auth.dto';

const router = Router();

// ============================================================================
// LUỒNG ĐĂNG KÝ 3 BƯỚC (Pre-verification Registration Flow)
// ============================================================================
// Bước 1: Nhập email, gửi mã OTP (lưu vào collection riêng email_verifications)
router.post('/register/request-otp', authRateLimiter, validateBody(RequestRegisterOtpSchema), authController.requestRegisterOtp);
router.post('/register', authRateLimiter, validateBody(RequestRegisterOtpSchema), authController.requestRegisterOtp);

// Bước 2: Nhập OTP -> Xác thực -> Tạo User trong DB -> Cấp Token & Cookie
router.post('/register/verify-otp', authRateLimiter, validateBody(VerifyRegisterOtpSchema), authController.verifyRegisterOtp);

// Bước 3: Chuyển hướng sang màn hình thiết lập Tên và Mật khẩu hoàn tất
router.post('/register/set-credentials', authenticate, validateBody(SetCredentialsSchema), authController.setCredentials);


// ============================================================================
// LUỒNG ĐĂNG NHẬP 2FA OTP & QUẢN TRỊ PHIÊN
// ============================================================================
router.post('/login', authRateLimiter, validateBody(LoginSchema), authController.login);
router.post('/verify-login-otp', authRateLimiter, validateBody(VerifyLoginOtpSchema), authController.verifyLoginOtp);
router.post('/resend-login-otp', authRateLimiter, validateBody(ResendLoginOtpSchema), authController.resendLoginOtp);

router.post('/refresh-token', authRateLimiter, authController.refreshToken);
router.post('/forgot-password', forgotPasswordRateLimiter, validateBody(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(ResetPasswordSchema), authController.resetPassword);

router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validateBody(UpdateProfileSchema), authController.updateProfile);
router.post('/password-otp/request', authenticate, authRateLimiter, authController.requestPasswordChangeOtp);
router.post('/password-otp/verify-and-change', authenticate, validateBody(ChangePasswordWithOtpSchema), authController.changePasswordWithOtp);
router.post('/logout', optionalAuth, authController.logout);

export default router;
