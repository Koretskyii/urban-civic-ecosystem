import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginAuthProps, RegisterAuthProps } from './types/auth.type.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {
  }

  async validateUserLogin(user: User | null, password: string) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
  }

  async findUser(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email,
      }
    });
  }

  async register(authData: RegisterAuthProps) {
    const { name, email, password } = authData;
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.create({
      data: { name, email, passwordHash }
    });

    return { message: 'Registration successful', user: { name, email } };
  }

  async login(loginData: LoginAuthProps) {
    const user = await this.findUser(loginData.email);
    await this.validateUserLogin(user, loginData.password);

    return { message: 'Login successful', token: 'fake-token' };
  }
}
