import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ROLES } from './constants/roles.const';

export type PermissionsByCity = Record<string, string[]>;

const ROLE_PRIORITY = [
  ROLES.ADMIN,
  ROLES.MUNICIPALITY,
  ROLES.ORGANIZER,
  ROLES.CITIZEN,
] as const;

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserRoleNames(userId: string, cityId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, role: { cityId } },
      select: { role: { select: { name: true } } },
    });

    return userRoles
      .map((userRole) => userRole.role?.name)
      .filter((roleName): roleName is string => Boolean(roleName));
  }

  async getUserPrimaryRole(
    userId: string,
    cityId: string,
  ): Promise<string | null> {
    const roleNames = await this.getUserRoleNames(userId, cityId);

    for (const role of ROLE_PRIORITY) {
      if (roleNames.includes(role)) {
        return role;
      }
    }

    return roleNames[0] ?? null;
  }

  async getUserPermissions(userId: string, cityId: string): Promise<string[]> {
    const roleNames = await this.getUserRoleNames(userId, cityId);

    if (roleNames.length === 0) {
      return [];
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleName: { in: roleNames } },
      select: { permission: { select: { key: true } } },
    });

    return Array.from(new Set(rolePermissions.map((rp) => rp.permission.key)));
  }

  async getUserPermissionsGlobal(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    });
    const roleNames = Array.from(
      new Set(
        userRoles
          .map((userRole) => userRole.role?.name)
          .filter((roleName): roleName is string => Boolean(roleName)),
      ),
    );

    if (roleNames.length === 0) {
      return [];
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleName: { in: roleNames } },
      select: { permission: { select: { key: true } } },
    });

    return Array.from(new Set(rolePermissions.map((rp) => rp.permission.key)));
  }

  async getUserPermissionsByCity(userId: string): Promise<PermissionsByCity> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            cityId: true,
            name: true,
          },
        },
      },
    });

    if (userRoles.length === 0) {
      return {};
    }

    const roleNames = Array.from(new Set(userRoles.map((ur) => ur.role.name)));
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleName: { in: roleNames } },
      select: {
        roleName: true,
        permission: { select: { key: true } },
      },
    });

    const permissionsByRole = new Map<string, string[]>();
    for (const rp of rolePermissions) {
      const existing = permissionsByRole.get(rp.roleName) ?? [];
      permissionsByRole.set(rp.roleName, [...existing, rp.permission.key]);
    }

    const result: PermissionsByCity = {};
    for (const userRole of userRoles) {
      if (!userRole.role) {
        continue;
      }
      const cityId = userRole.role.cityId;
      const roleName = userRole.role.name;
      const rolePermissionKeys = permissionsByRole.get(roleName) ?? [];
      result[cityId] = Array.from(
        new Set([...(result[cityId] ?? []), ...rolePermissionKeys]),
      );
    }

    return result;
  }

  /**
   * Check whether a user has a specific permission within a given city.
   * 1. Get the user's role names in that city.
   * 2. Check the global RolePermission table for any matching (roleName, permissionKey).
   */
  async hasPermission(
    userId: string,
    cityId: string,
    permissionKey: string,
  ): Promise<boolean> {
    const roleNames = await this.getUserRoleNames(userId, cityId);
    if (roleNames.length === 0) return false;

    const match = await this.prisma.rolePermission.findFirst({
      where: {
        roleName: { in: roleNames },
        permission: { key: permissionKey },
      },
    });

    return match != null;
  }

  /**
   * Provision the 4 default Role rows for a given city.
   */
  async seedRolesForCity(cityId: string): Promise<void> {
    for (const roleName of Object.values(ROLES)) {
      await this.prisma.role.upsert({
        where: { cityId_name: { cityId, name: roleName } },
        update: {},
        create: { cityId, name: roleName },
      });
    }
  }

  /**
   * Assign a named role to a user within a city.
   */
  async assignRole(
    userId: string,
    cityId: string,
    roleName: string,
  ): Promise<void> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { cityId_name: { cityId, name: roleName } },
    });

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
  }

  /**
   * Remove a named role from a user within a city.
   */
  async revokeRole(
    userId: string,
    cityId: string,
    roleName: string,
  ): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { cityId_name: { cityId, name: roleName } },
    });
    if (!role) return;

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });
  }
}
