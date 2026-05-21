import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLES } from '@/modules/rbac/constants/roles.const';
import { UpdateCityMemberRoleDto } from './dto';
import { CITY_MEMBERS_ERRORS } from './city-members.constants';

const ROLE_PRIORITY = [
  ROLES.ADMIN,
  ROLES.MUNICIPALITY,
  ROLES.ORGANIZER,
  ROLES.CITIZEN,
] as const;

@Injectable()
export class CityMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(cityId: string) {
    const members = await this.prisma.userCity.findMany({
      where: { cityId },
      select: {
        userId: true,
        joinedAt: true,
        user: {
          select: {
            name: true,
            email: true,
            userRoles: {
              where: {
                role: { cityId },
              },
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      joinedAt: member.joinedAt,
      role:
        this.pickPrimaryRole(
          member.user.userRoles
            .map((item) => item.role?.name)
            .filter((roleName): roleName is string => Boolean(roleName)),
        ) ?? ROLES.CITIZEN,
    }));
  }

  async updateMemberRole(
    cityId: string,
    targetUserId: string,
    actorUserId: string,
    dto: UpdateCityMemberRoleDto,
  ) {
    const member = await this.prisma.userCity.findUnique({
      where: {
        userId_cityId: {
          userId: targetUserId,
          cityId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!member) {
      throw new NotFoundException(CITY_MEMBERS_ERRORS.MEMBER_NOT_FOUND);
    }

    const [cityRoles, targetRole] = await Promise.all([
      this.prisma.role.findMany({
        where: { cityId },
        select: { id: true, name: true },
      }),
      this.prisma.role.findUnique({
        where: {
          cityId_name: {
            cityId,
            name: dto.role,
          },
        },
      }),
    ]);

    if (!targetRole) {
      throw new NotFoundException(CITY_MEMBERS_ERRORS.ROLE_NOT_FOUND);
    }

    const cityRoleIds = cityRoles.map((role) => role.id);
    const adminRoleIds = cityRoles
      .filter((role) => role.name === ROLES.ADMIN)
      .map((role) => role.id);
    const adminRoleIdSet = new Set(adminRoleIds);

    const targetUserCityRoles = await this.prisma.userRole.findMany({
      where: {
        userId: targetUserId,
        roleId: {
          in: cityRoleIds,
        },
      },
      select: {
        roleId: true,
      },
    });

    const targetIsAdmin = targetUserCityRoles.some((userRole) =>
      adminRoleIdSet.has(userRole.roleId),
    );

    if (
      targetUserCityRoles.length === 1 &&
      targetUserCityRoles[0].roleId === targetRole.id
    ) {
      return {
        userId: targetUserId,
        role: targetRole.name,
      };
    }

    if (targetIsAdmin && dto.role !== ROLES.ADMIN) {
      const cityAdminLinks = await this.prisma.userRole.findMany({
        where: {
          roleId: {
            in: adminRoleIds,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      if (cityAdminLinks.length <= 1) {
        if (targetUserId === actorUserId) {
          throw new BadRequestException(
            CITY_MEMBERS_ERRORS.SELF_LAST_ADMIN_PROTECTION,
          );
        }

        throw new BadRequestException(CITY_MEMBERS_ERRORS.LAST_ADMIN_PROTECTION);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          userId: targetUserId,
          roleId: {
            in: cityRoleIds,
          },
        },
      });

      await tx.userRole.create({
        data: {
          userId: targetUserId,
          roleId: targetRole.id,
        },
      });
    });

    return {
      userId: targetUserId,
      role: targetRole.name,
    };
  }

  private pickPrimaryRole(roleNames: string[]): string | null {
    for (const role of ROLE_PRIORITY) {
      if (roleNames.includes(role)) {
        return role;
      }
    }

    return roleNames[0] ?? null;
  }
}
