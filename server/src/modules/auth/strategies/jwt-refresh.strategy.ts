import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
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

    validate(req: Request, payload: any) {
        if (!payload) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        return { id: payload.sub, email: payload.email };
    }
}