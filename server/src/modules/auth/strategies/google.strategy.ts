import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AUTH_PROVIDERS } from '../constants/auth.const.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow('google.clientId'),
      clientSecret: configService.getOrThrow('google.clientSecret'),
      callbackURL: configService.getOrThrow('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = {
      email: profile.emails[0].value,
      name: profile.displayName,
      provider: AUTH_PROVIDERS.GOOGLE,
      providerId: profile.id,
    };
    done(null, user);
  }
}
