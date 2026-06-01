import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@/types/auth.types';
import { ERROR_MESSAGES } from '../constants/errors.const';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error(ERROR_MESSAGES.JWT_SECRET_NOT_DEFINED);
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request): string | null => {
          // Limit query-token auth to SSE only to avoid leaking JWTs via URLs.
          if (request.path !== '/notifications/stream') {
            return null;
          }

          const tokenFromQuery = request.query?.token;
          if (
            typeof tokenFromQuery !== 'string' ||
            tokenFromQuery.length === 0
          ) {
            return null;
          }

          return tokenFromQuery.startsWith('Bearer ')
            ? tokenFromQuery.slice(7)
            : tokenFromQuery;
        },
        (request: Request): string | null => {
          const cookieToken = request.cookies?.access_token as
            | string
            | undefined;
          return cookieToken ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload?.sub,
      email: payload?.email,
    };
  }
}
