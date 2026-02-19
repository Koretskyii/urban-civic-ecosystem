import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Res, Req, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { RegisterAuthProps } from './types/auth.type.js';
import { LocalGuard } from './guards/local.guard.js';
import { JWTGuard } from './guards/jwt.guard.js';
import { JWTRefreshGuard } from './guards/jwt-refresh.guard.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // LocalGuard runs LocalStrategy.validate() → sets req.user
    return this.authService.login(req.user as any, res);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() body: RegisterAuthProps, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(body, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  // example of using JWTGuard
  @UseGuards(JWTGuard)
  @Get('profile')
  async profile(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.getProfile(user.id);
  }
}
