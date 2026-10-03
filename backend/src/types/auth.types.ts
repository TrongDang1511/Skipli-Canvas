import { Request } from 'express';

export interface AuthUserPayload {
  id: string;
  email: string;
  displayName: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
