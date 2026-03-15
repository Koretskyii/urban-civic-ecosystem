import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../constants/index.js';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get('jwt.refreshSecret');

    super({
      jwtFromRequest: (req) => {
        return req.cookies?.refresh_token;
      },
      secretOrKey: secret,
      passReqToCallback: true,
    });
  } 

  validate(_req: Request, payload: any) {
    if (!payload) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return { id: payload.sub, email: payload.email };
  }
}
