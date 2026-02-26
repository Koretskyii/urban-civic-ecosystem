import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { RbacService } from "../rbac.service.js";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorators.js";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly rbacService: RbacService,
        private readonly reflector: Reflector
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()]
        )
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        try {
            const { id: userId } = request.user;
            const cityId = request.params.cityId || request.body.cityId;
            const hasPermissions = await Promise.all(
                requiredPermissions.map(permission => this.rbacService.hasPermission(userId, cityId, permission))
            )
            return hasPermissions.every(Boolean);
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}