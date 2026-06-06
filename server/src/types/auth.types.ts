import type { SystemRole } from '@/generated/prisma/enums';

export type User = {
  id: string;
  email?: string;
  systemRole?: SystemRole;
};

export type GoogleProfile = {
  id: string;
  displayName: string;
  emails?: { value: string }[];
};

export type JwtPayload = {
  sub: string;
  email: string;
  permissions?: string[];
  systemRole?: SystemRole;
  iat?: number;
  exp?: number;
};

export type RequestWithUser = {
  user: User;
  params: Record<string, string>;
  body: Record<string, unknown>;
  cookies?: Record<string, string>;
};

export type OAuthUserData = {
  email: string;
  name: string;
  provider: string;
  providerId: string;
};
