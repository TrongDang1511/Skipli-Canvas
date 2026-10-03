export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  refreshTokenHash?: string | null;
  createdAt: string;
  updatedAt: string;
  // Thiết kế mở rộng sẵn sàng cho các trường bổ sung sau này (avatar, role, credits, v.v.)
  [key: string]: any;
}
