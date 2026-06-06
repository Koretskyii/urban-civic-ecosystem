export type SystemRole = 'USER' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  systemRole?: SystemRole;
  provider?: string;
  providerId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
