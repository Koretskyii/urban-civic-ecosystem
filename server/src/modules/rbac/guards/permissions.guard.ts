import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RbacService } from '../rbac.service.js';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorators.js';
import type { RequestWithUser } from '@/types/auth.types.js';
import { ERROR_MESSAGES } from '@/modules/auth/constants/errors.const.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly rbacService: RbacService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    try {
      const { id: userId } = request.user;
      const cityId =
        request.params.cityId && typeof request.params?.cityId === 'string'
          ? request.params.cityId
          : request.body.cityId && typeof request.body?.cityId === 'string'
            ? request.body.cityId
            : undefined;

      if (!cityId) {
        throw new UnauthorizedException(ERROR_MESSAGES.CITY_ID_MISSING);
      }

      const hasPermissions = await Promise.all(
        requiredPermissions.map((permission) =>
          this.rbacService.hasPermission(userId, cityId, permission),
        ),
      );
      return hasPermissions.every(Boolean);
    } catch (error: unknown) {
      console.error(error);
      return false;
    }
  }
}
