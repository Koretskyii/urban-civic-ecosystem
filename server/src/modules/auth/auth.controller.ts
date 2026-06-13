import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
  Body,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/index';
import { LocalGuard } from './guards/local.guard';
import { JWTGuard } from './guards/jwt.guard';
import { JWTRefreshGuard } from './guards/jwt-refresh.guard';
import type { Request, Response } from 'express';
import {
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JWTExpiredGuard } from './guards/jwt-expired.guard';
import { GoogleGuard } from './guards/google.guard';
import type { OAuthUserData, User } from '@/types/auth.types';
import type { User as PrismaUser } from '@/generated/prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiConflictResponse({ description: 'User already exists' })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(body, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user locally' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'User logged in successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user as PrismaUser, res);
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Login with Google' })
  @ApiOkResponse({ description: 'User logged in successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  googleLogin() {
    // Guard handles the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Google callback' })
  @ApiOkResponse({ description: 'User logged in successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = await this.authService.validateOAuthUser(
      req.user as OAuthUserData,
      res,
    );

    const clientUrl = new URL(
      '/auth/google/callback',
      process.env.CLIENT_URL || 'https://localhost:3000',
    );
    clientUrl.searchParams.set('token', accessToken);
    res.redirect(clientUrl.toString());
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTRefreshGuard)
  @Post('refresh')
  @ApiOkResponse({ description: 'Access token refreshed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JWTExpiredGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiOkResponse({ description: 'User logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @UseGuards(JWTGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('access_token')
  @ApiOkResponse({ description: 'Current user retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid access token' })
  async me(@Req() req: Request) {
    const user = req.user as User;
    if (!user) throw new UnauthorizedException();
    return this.authService.getMe(user.id);
  }

  @UseGuards(JWTGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth('access_token')
  @ApiOkResponse({ description: 'User profile retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid access token' })
  async profile(@Req() req: Request) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.getMe(user.id);
  }

  @UseGuards(JWTGuard)
  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBearerAuth('access_token')
  @ApiOkResponse({ description: 'User password changed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid access token' })
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.changePassword(user?.id, body);
  }
}
