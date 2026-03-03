import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto, RegisterDto } from './dto/index.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { User } from '../../generated/prisma/client.js';
import { AUTH_PROVIDERS } from './constants/auth.const.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateLogin(loginData: LoginDto): Promise<User> {
    const user = await this.findUser(loginData.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google authentication. Please log in with Google.',
      );
    }
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
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
        throw new UnauthorizedException(
          'This email is linked to a Google account. Please log in with Google.',
        );
      }
      throw new UnauthorizedException('User with this email already exists');
    }

    const user = await this.createLocalUser(name, email, password);
    const accessToken = this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login(user: User, res: Response) {
    const accessToken = this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async refresh(req: Request, res: Response) {
    const { id, email } = req.user as { id: string; email: string };

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));

    return { accessToken };
  }

  async validateOAuthUser(
    user: { email: string; name: string; provider: string; providerId: string },
    res: Response,
  ) {
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
      throw new UnauthorizedException('Unable to authenticate OAuth user');
    }

    const accessToken = this.generateAccessToken(userData);
    this.setRefreshCookie(res, this.generateRefreshToken(userData));

    return {
      accessToken,
      user: { id: userData.id, name: userData.name, email: userData.email },
    };
  }

  async logout(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
    return { message: 'Logged out' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash, ...profile } = user;
    return profile;
  }

  private generateAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
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
}
