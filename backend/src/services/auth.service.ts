import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { userRepository } from '../repositories/user.repository';
import { User } from '../models/user.model';
import { AuthUserPayload, TokenPair } from '../types/auth.types';
import { RegisterDTO, LoginDTO, AuthResponseData, UserResponseDTO } from '../dtos/auth.dto';

export class AuthService {
  private accessSecret = env.jwtAccessSecret;
  private refreshSecret = env.jwtRefreshSecret;
  private accessExpiresIn = env.jwtAccessExpiresIn;
  private refreshExpiresIn = env.jwtRefreshExpiresIn;

  async register(dto: RegisterDTO): Promise<AuthResponseData> {
    const email = dto.email.toLowerCase().trim();
    
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error: any = new Error('Email already registered');
      error.status = 400;
      throw error;
    }

    // 2. Băm mật khẩu bằng bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Tạo ID và đối tượng User mới
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const displayName = dto.displayName?.trim() || email.split('@')[0];

    const newUser: User = {
      id,
      email,
      passwordHash,
      displayName,
      createdAt: now,
      updatedAt: now
    };

    // 4. Lưu User vào Firestore
    await userRepository.create(newUser);

    // 5. Tạo cặp Token (Access Token 15m + Refresh Token 7d)
    const tokens = this.generateTokenPair({ id: newUser.id, email: newUser.email, displayName: newUser.displayName });

    // 6. Băm và lưu Refresh Token Hash vào Firestore để bảo mật
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await userRepository.updateRefreshToken(newUser.id, refreshTokenHash);

    return {
      user: this.sanitizeUser(newUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async login(dto: LoginDTO): Promise<AuthResponseData> {
    const email = dto.email.toLowerCase().trim();

    // 1. Tìm user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    // 2. Kiểm tra mật khẩu băm bằng bcryptjs
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    // 3. Tạo cặp Token mới
    const tokens = this.generateTokenPair({ id: user.id, email: user.email, displayName: user.displayName });

    // 4. Cập nhật Refresh Token Hash mới vào Firestore
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await userRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async refreshTokens(refreshTokenStr: string): Promise<TokenPair> {
    try {
      // 1. Giải mã & Verify Refresh Token bằng Refresh Secret Key
      const decoded = jwt.verify(refreshTokenStr, this.refreshSecret) as AuthUserPayload;

      // 2. Tìm User trong Database
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.refreshTokenHash) {
        const error: any = new Error('Invalid or revoked refresh token');
        error.status = 401;
        throw error;
      }

      // 3. Kiểm tra mã Refresh Token có khớp với hash trong DB không
      const isRefreshValid = await bcrypt.compare(refreshTokenStr, user.refreshTokenHash);
      if (!isRefreshValid) {
        const error: any = new Error('Invalid or revoked refresh token');
        error.status = 401;
        throw error;
      }

      // 4. Tạo cặp Token mới
      const newTokens = this.generateTokenPair({ id: user.id, email: user.email, displayName: user.displayName });

      // 5. Cập nhật Refresh Token Hash mới vào DB (Token Rotation)
      const newRefreshTokenHash = await bcrypt.hash(newTokens.refreshToken, 10);
      await userRepository.updateRefreshToken(user.id, newRefreshTokenHash);

      return newTokens;
    } catch (err: any) {
      const error: any = new Error('Invalid or expired refresh token');
      error.status = 401;
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    await userRepository.updateRefreshToken(userId, null);
  }

  async getUserProfile(userId: string): Promise<UserResponseDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return this.sanitizeUser(user);
  }

  verifyAccessToken(token: string): AuthUserPayload {
    try {
      return jwt.verify(token, this.accessSecret) as AuthUserPayload;
    } catch (err) {
      const error: any = new Error('Invalid or expired access token');
      error.status = 401;
      throw error;
    }
  }

  private generateTokenPair(payload: AuthUserPayload): TokenPair {
    const accessToken = jwt.sign(
      { id: payload.id, email: payload.email, displayName: payload.displayName },
      this.accessSecret,
      { expiresIn: this.accessExpiresIn as any }
    );

    const refreshToken = jwt.sign(
      { id: payload.id, email: payload.email, displayName: payload.displayName },
      this.refreshSecret,
      { expiresIn: this.refreshExpiresIn as any }
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User): UserResponseDTO {
    const { passwordHash, refreshTokenHash, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();
