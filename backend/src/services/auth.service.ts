import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.config';
import { userRepository } from '../repositories/user.repository';
import { User } from '../models/user.model';
import { AuthUserPayload, TokenPair } from '../types/auth.types';
import { RegisterDTO, LoginDTO, AuthResponseData, UserResponseDTO } from '../dtos/auth.dto';

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

  async register(dto: RegisterDTO): Promise<AuthResponseData> {
    const email = dto.email.toLowerCase().trim();
    
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw createHttpError('Email already registered', 400);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

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

    await userRepository.create(newUser);

    const tokens = this.generateTokenPair({ id: newUser.id, email: newUser.email, displayName: newUser.displayName });

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

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw createHttpError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw createHttpError('Invalid email or password', 401);
    }

    const tokens = this.generateTokenPair({ id: user.id, email: user.email, displayName: user.displayName });

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

  async getUserProfile(userId: string): Promise<UserResponseDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createHttpError('User not found', 404);
    }
    return this.sanitizeUser(user);
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
    const { passwordHash, refreshTokenHash, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();
