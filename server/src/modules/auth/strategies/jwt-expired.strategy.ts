import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../../types/auth.types.js';

@Injectable()
export class JwtExpiredStrategy extends PassportStrategy(
  Strategy,
  'jwt-expired',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error('JWT secret is not defined in the configuration');
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
