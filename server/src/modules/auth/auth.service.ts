import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/index';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { User } from '../../generated/prisma/client';
import {
  AUTH_PROVIDERS,
  ERROR_MESSAGES,
  AUTH_SUCCESS_MESSAGES,
  REFRESH_COOKIE_OPTIONS,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_CLEAR_OPTIONS,
  ACCESS_CLEAR_OPTIONS,
} from './constants/index';
import type {
  User as UserAuthData,
  OAuthUserData,
} from '@/types/auth.types.js';
import { ChangePasswordDto } from './dto';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  async validateLogin(loginData: LoginDto): Promise<User> {
    const user = await this.findUser(loginData.email);
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    if (user.isBlocked) {
      throw new ForbiddenException(ERROR_MESSAGES.USER_BLOCKED);
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.OAUTH_LOGIN_REQUIRED);
    }
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    return user;
  }

  async findUser(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createLocalUser(name: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { name, email, passwordHash, provider: AUTH_PROVIDERS.LOCAL },
    });
  }

  async createOAuthUser(
    name: string,
    email: string,
    provider: string,
    providerId: string,
  ) {
    return this.prisma.user.create({
      data: { name, email, provider, providerId },
    });
  }

  async register(authData: RegisterDto, res: Response) {
    const { name, email, password } = authData;

    const existing = await this.findUser(email);
    if (existing) {
      if (existing.provider !== AUTH_PROVIDERS.LOCAL) {
        throw new UnauthorizedException(ERROR_MESSAGES.LOCAL_LOGIN_REQUIRED);
      }
      throw new UnauthorizedException(ERROR_MESSAGES.USER_EXISTS);
    }

    const user = await this.createLocalUser(name, email, password);
    const accessToken = await this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));
    this.setAccessCookie(res, accessToken);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
      },
    };
  }

  async login(user: User, res: Response) {
    const accessToken = await this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));
    this.setAccessCookie(res, accessToken);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
      },
    };
  }

  async refresh(req: Request, res: Response) {
    const { id } = req.user as UserAuthData;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new ForbiddenException(ERROR_MESSAGES.USER_BLOCKED);
    }

    const accessToken = await this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));
    this.setAccessCookie(res, accessToken);

    return { accessToken };
  }

  async validateOAuthUser(user: OAuthUserData, res: Response) {
    let userData = await this.findUser(user.email);

    if (userData && !userData.providerId) {
      // Local user logging in with Google for the first time — link accounts
      userData = await this.prisma.user.update({
        where: { id: userData.id },
        data: { providerId: user.providerId },
      });
    }

    if (!userData) {
      userData = await this.createOAuthUser(
        user.name,
        user.email,
        AUTH_PROVIDERS.GOOGLE,
        user.providerId,
      );
    }

    if (!userData) {
      throw new UnauthorizedException(ERROR_MESSAGES.OAUTH_USER_AUTH_FAILED);
    }

    if (userData.isBlocked) {
      throw new ForbiddenException(ERROR_MESSAGES.USER_BLOCKED);
    }

    const accessToken = await this.generateAccessToken(userData);
    this.setRefreshCookie(res, this.generateRefreshToken(userData));
    this.setAccessCookie(res, accessToken);

    return {
      accessToken,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        systemRole: userData.systemRole,
      },
    };
  }

  logout(res: Response) {
    res.clearCookie('refresh_token', REFRESH_CLEAR_OPTIONS);
    res.clearCookie('access_token', ACCESS_CLEAR_OPTIONS);
    return { message: AUTH_SUCCESS_MESSAGES.LOGGED_OUT };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new ForbiddenException(ERROR_MESSAGES.USER_BLOCKED);
    }

    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  private async generateAccessToken(user: User): Promise<string> {
    const permissions = await this.rbacService.getUserPermissionsGlobal(
      user.id,
    );

    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        permissions,
        systemRole: user.systemRole,
        isBlocked: user.isBlocked,
      },
      { expiresIn: Number(this.configService.get('jwt.expiresIn')) },
    );
  }

  private generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: Number(this.configService.get('jwt.refreshExpiresIn')),
      },
    );
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, REFRESH_COOKIE_OPTIONS);
  }

  private setAccessCookie(res: Response, token: string): void {
    res.cookie('access_token', token, ACCESS_COOKIE_OPTIONS);
  }

  async changePassword(userId: string, body: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new ForbiddenException(ERROR_MESSAGES.USER_BLOCKED);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.OAUTH_LOGIN_REQUIRED);
    }

    const isPasswordValid = await bcrypt.compare(
      body.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    const newPasswordHash = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    const { passwordHash: _, ...profile } = user;
    return profile;
  }
}
