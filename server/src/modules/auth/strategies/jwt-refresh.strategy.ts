import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../constants/index.js';
import type { JwtPayload, RequestWithUser } from '@/types/auth.types.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.refreshSecret');

    if (!secret) {
      throw new Error(ERROR_MESSAGES.JWT_REFRESH_SECRET_NOT_DEFINED);
    }

    super({
      jwtFromRequest: (req: RequestWithUser) => {
        return req.cookies?.refresh_token ?? null;
      },
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(_req: RequestWithUser, payload: JwtPayload) {
    if (!payload) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return { id: payload.sub, email: payload.email };
  }
}
