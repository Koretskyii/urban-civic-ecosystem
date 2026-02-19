import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginAuthProps, RegisterAuthProps } from './types/auth.type.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

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
  ) { }

  async validateLogin(loginData: LoginAuthProps): Promise<User> {
    const user = await this.findUser(loginData.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return user;
  }

  async findUser(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async register(authData: RegisterAuthProps, res: Response) {
    const { name, email, password } = authData;

    const existing = await this.findUser(email);
    if (existing) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { name, email, passwordHash },
    });

    const accessToken = this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));

    return { accessToken, user: { id: user.id, name: user.name, email: user.email } };
  }

  async login(user: User, res: Response) {
    const accessToken = this.generateAccessToken(user);
    this.setRefreshCookie(res, this.generateRefreshToken(user));

    return { accessToken, user: { id: user.id, name: user.name, email: user.email } };
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

  async logout(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
    return { message: 'Logged out' };
  }

  // example
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
