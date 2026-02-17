import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { LoginAuthProps, RegisterAuthProps } from './types/auth.type.js';
import { LocalGuard } from './guards/local.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Body() body: LoginAuthProps) {
    return this.authService.login(body);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() body: RegisterAuthProps) {
    return this.authService.register(body);
  }
}
