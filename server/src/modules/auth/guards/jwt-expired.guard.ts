import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JWTExpiredGuard extends AuthGuard('jwt-expired') {}
