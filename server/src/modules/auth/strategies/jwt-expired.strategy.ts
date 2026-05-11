import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../../types/auth.types';
import { ERROR_MESSAGES } from '../constants/index';

@Injectable()
export class JwtExpiredStrategy extends PassportStrategy(
  Strategy,
  'jwt-expired',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error(ERROR_MESSAGES.JWT_SECRET_NOT_DEFINED);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload?.sub, email: payload?.email };
  }
}
