import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.config';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BrandedEmailLayoutOptions {
  title: string;
  content: string;
  footerNote?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    if (env.smtpUser && env.smtpUser.trim() !== '' && env.smtpPass && env.smtpPass.trim() !== '') {
      this.transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
      this.isConfigured = true;
    } else {
      this.transporter = null;
      this.isConfigured = false;
    }
  }

  /**
   * Kiểm tra kết nối đến máy chủ SMTP (Brevo / Gmail)
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter || !this.isConfigured) {
      console.warn('[EmailService] SMTP not configured. Running in Mock Console mode.');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log(`[EmailService] SMTP connection verified successfully (${env.smtpHost}:${env.smtpPort}).`);
      return true;
    } catch (error) {
      console.error('[EmailService Error] Failed to verify SMTP connection:', error);
      return false;
    }
  }

  /**
   * Layout HTML chuẩn Light & Luxurious dùng chung cho MỌI email trong toàn hệ thống.
   * Màu chủ đạo: Navy Blue (#0B192C), Metallic Gold (#D4AF37), Nền Warm White (#FAF9F6).
   */
  renderBrandedLayout(options: BrandedEmailLayoutOptions): string {
    const year = new Date().getFullYear();
    const footerNote = options.footerNote || 'If you did not initiate this request, you can safely ignore this email.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0B192C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF9F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(11, 25, 44, 0.05); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0B192C; padding: 32px 40px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
                SKIPLI <span style="color: #D4AF37;">CANVAS</span>
              </h1>
              <p style="margin: 6px 0 0; color: #94A3B8; font-size: 13px; letter-spacing: 0.3px;">
                AI-Powered Web Experience
              </p>
            </td>
          </tr>

          <!-- Main Content Slot -->
          <tr>
            <td style="padding: 40px;">
              ${options.content}

              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0 20px;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                ${footerNote}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 20px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                &copy; ${year} Skipli Canvas. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Hàm cốt lõi gửi email đa năng (Core Generic Method).
   * Hỗ trợ tự động fallback in ra terminal nếu chưa có SMTP hoặc khi lỗi xảy ra.
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      console.log('\n======================================================');
      console.log('✉️  [DEV EMAIL CONSOLE MOCK]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('------------------------------------------------------');
      console.log(options.text || '[HTML email content generated]');
      console.log('======================================================\n');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`[EmailService] Email successfully sent to ${options.to}: "${options.subject}"`);
    } catch (error) {
      console.error(`[EmailService Error] Failed to send email to ${options.to}:`, error);
      // Khi gửi qua SMTP gặp sự cố, log cảnh báo để dev không bị gián đoạn flow
      console.log('\n⚠️  [DEV FALLBACK FOR FAILED SMTP]');
      console.log(`To: ${options.to} | Subject: ${options.subject}`);
      console.log('======================================================\n');
      throw error;
    }
  }

  // ===========================================================================
  // CÁC HÀM NGHIỆP VỤ CHUYÊN BIỆT (MỞ RỘNG CHO AUTH, VERIFY VÀ RECOVERY)
  // ===========================================================================

  /**
   * 1. Gửi liên kết Đặt lại mật khẩu (Password Reset)
   */
  async sendPasswordResetEmail(toEmail: string, displayName: string, rawToken: string): Promise<void> {
    const resetUrl = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    // Dev log tiện lợi để click test nhanh
    console.log(`\n🔑 [RESET LINK GENERATED]: ${resetUrl}\n`);

    const content = `
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0B192C;">
        Password Reset Request
      </h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
        Hello <strong>${displayName}</strong>,
      </p>
      <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #475569;">
        We received a request to reset your password for your Skipli Canvas account. Click the button below to choose a new password:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px;">
        <tr>
          <td align="center" style="border-radius: 8px; background-color: #0B192C;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px; border: 1px solid #D4AF37;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #64748B;">
        This link will expire in <strong>${env.passwordResetTokenExpiresIn}</strong>.
      </p>

      <p style="margin: 16px 0 6px; font-size: 12px; color: #94A3B8;">
        Or copy and paste this URL into your browser:
      </p>
      <p style="margin: 0; font-size: 12px; word-break: break-all;">
        <a href="${resetUrl}" target="_blank" style="color: #1E3E62; text-decoration: underline;">
          ${resetUrl}
        </a>
      </p>
    `;

    const html = this.renderBrandedLayout({
      title: 'Reset Your Password - Skipli Canvas',
      content,
      footerNote: `This link will expire in ${env.passwordResetTokenExpiresIn}. If you did not request a password reset, you can safely ignore this email.`
    });

    await this.sendMail({
      to: toEmail,
      subject: 'Reset Your Password - Skipli Canvas',
      html,
      text: `Hello ${displayName},\n\nReset your password by opening this link: ${resetUrl}\n\nThis link expires in ${env.passwordResetTokenExpiresIn}.`,
    });
  }

  /**
   * 2. Gửi mã OTP xác thực email khi Đăng ký (Email Verification OTP)
   * Sẵn sàng tích hợp cho luồng Register
   */
  async sendEmailVerificationOtp(toEmail: string, displayName: string, otpCode: string, expiresInMinutes: number = 10): Promise<void> {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0B192C;">
        Verify Your Email Address
      </h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
        Welcome to Skipli Canvas, <strong>${displayName}</strong>!
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
        Please use the 6-digit verification code below to confirm your account:
      </p>

      <div style="text-align: center; margin: 0 0 28px;">
        <div style="display: inline-block; background-color: #0B192C; color: #D4AF37; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 36px; border-radius: 8px; border: 1px solid #D4AF37;">
          ${otpCode}
        </div>
      </div>

      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748B; text-align: center;">
        This code is valid for <strong>${expiresInMinutes} minutes</strong>.
      </p>
    `;

    const html = this.renderBrandedLayout({
      title: 'Verify Your Email - Skipli Canvas',
      content,
      footerNote: `Do not share this verification code with anyone. It expires in ${expiresInMinutes} minutes.`
    });

    await this.sendMail({
      to: toEmail,
      subject: `${otpCode} is your Skipli Canvas verification code`,
      html,
      text: `Welcome to Skipli Canvas, ${displayName}!\n\nYour email verification code is: ${otpCode}\nValid for ${expiresInMinutes} minutes.`,
    });
  }

  /**
   * 3. Gửi mã OTP hoặc Magic Link Đăng nhập (Login OTP / 2FA)
   * Sẵn sàng tích hợp cho luồng Login không cần mật khẩu hoặc bảo mật 2 lớp
   */
  async sendLoginOtpEmail(toEmail: string, displayName: string, otpCode: string, expiresInMinutes: number = 5): Promise<void> {
    const content = `
      <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0B192C;">
        Your Login Verification Code
      </h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
        Hello <strong>${displayName}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
        A sign-in attempt was requested for your Skipli Canvas account. Enter the one-time code below to proceed:
      </p>

      <div style="text-align: center; margin: 0 0 28px;">
        <div style="display: inline-block; background-color: #0B192C; color: #D4AF37; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 36px; border-radius: 8px; border: 1px solid #D4AF37;">
          ${otpCode}
        </div>
      </div>

      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748B; text-align: center;">
        This login code expires in <strong>${expiresInMinutes} minutes</strong>.
      </p>
    `;

    const html = this.renderBrandedLayout({
      title: 'Your Login Code - Skipli Canvas',
      content,
      footerNote: `If you did not request this login code, please change your password immediately.`
    });

    await this.sendMail({
      to: toEmail,
      subject: `${otpCode} is your Skipli Canvas login code`,
      html,
      text: `Hello ${displayName},\n\nYour Skipli Canvas login code is: ${otpCode}\nValid for ${expiresInMinutes} minutes.`,
    });
  }
}

export const emailService = new EmailService();
