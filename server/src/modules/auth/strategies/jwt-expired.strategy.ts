import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtExpiredStrategy extends PassportStrategy(
  Strategy,
  'jwt-expired',
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get('jwt.secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: secret,
    });
  }

  validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}
