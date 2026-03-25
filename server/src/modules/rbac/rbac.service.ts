import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ROLES } from './constants/roles.const';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) { }

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
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, role: { cityId } },
      select: { role: { select: { name: true } } },
    });

    if (userRoles.length === 0) return false;

    const roleNames = userRoles.map((ur) => ur.role.name);

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
