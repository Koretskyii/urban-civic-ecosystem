import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Res, Req, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto } from './dto/index.js';
import { LocalGuard } from './guards/local.guard.js';
import { JWTGuard } from './guards/jwt.guard.js';
import { JWTRefreshGuard } from './guards/jwt-refresh.guard.js';
import type { Request, Response } from 'express';
import { ApiOperation, ApiTags, ApiBody, ApiOkResponse, ApiUnauthorizedResponse, ApiCreatedResponse, ApiConflictResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PERMISSIONS_KEYS } from '../rbac/constants/permissions.const.js';
import { RequirePermissions } from '../rbac/decorators/index.js';
import { PermissionsGuard } from '../rbac/guards/index.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'User logged in successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user as any, res);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiConflictResponse({ description: 'User already exists' })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(body, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTRefreshGuard)
  @Post('refresh')

  @ApiOkResponse({ description: 'Access token refreshed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })

  @ApiOkResponse({ description: 'User logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @UseGuards(JWTGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.USER_VIEW_PROFILE)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth('access_token')
  @ApiOkResponse({ description: 'User profile retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid access token' })
  async profile(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.getProfile(user.id);
  }
}
