export interface RegisterDTO {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  [key: string]: any;
}

export interface AuthResponseData {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}
