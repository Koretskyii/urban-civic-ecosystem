import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLES } from '@/modules/rbac/constants/roles.const';
import { GetCityMembersQueryDto, UpdateCityMemberRoleDto } from './dto';
import { CITY_MEMBERS_ERRORS } from './city-members.const';

const ROLE_PRIORITY = [ROLES.ADMIN, ROLES.MUNICIPALITY, ROLES.CITIZEN] as const;

@Injectable()
export class CityMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(cityId: string, query: GetCityMembersQueryDto = {}) {
    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const sortBy = query.sortBy ?? 'joinedAt';
    const sortOrder = query.sortOrder ?? 'asc';
    const search = query.search?.trim();
    const skip = (page - 1) * limit;
    const where = {
      cityId,
      ...(search
        ? {
            user: {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
      ...(query.role
        ? {
            user: {
              ...(search
                ? {
                    OR: [
                      {
                        name: {
                          contains: search,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        email: {
                          contains: search,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  }
                : {}),
              userRoles: {
                some: {
                  role: {
                    cityId,
                    name: query.role,
                  },
                },
              },
            },
          }
        : {}),
    };

    const orderBy =
      sortBy === 'name' || sortBy === 'email'
        ? { user: { [sortBy]: sortOrder } }
        : { joinedAt: sortOrder };

    const [members, total] = await Promise.all([
      this.prisma.userCity.findMany({
        where,
        select: {
          userId: true,
          joinedAt: true,
          isBlocked: true,
          blockedAt: true,
          blockedById: true,
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.userCity.count({ where }),
    ]);

    const items = members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      joinedAt: member.joinedAt,
      isBlocked: member.isBlocked,
      blockedAt: member.blockedAt,
      blockedById: member.blockedById,
      role:
        this.pickPrimaryRole(
          member.user.userRoles
            .map((item) => item.role?.name)
            .filter((roleName): roleName is string => Boolean(roleName)),
        ) ?? ROLES.CITIZEN,
    }));

    return {
      items,
      total,
      page,
      limit,
      nextPage: skip + members.length < total ? page + 1 : null,
    };
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

        throw new BadRequestException(
          CITY_MEMBERS_ERRORS.LAST_ADMIN_PROTECTION,
        );
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

  async updateMemberBlockStatus(
    cityId: string,
    targetUserId: string,
    actorUserId: string,
    isBlocked: boolean,
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
        isBlocked: true,
      },
    });

    if (!member) {
      throw new NotFoundException(CITY_MEMBERS_ERRORS.MEMBER_NOT_FOUND);
    }

    if (isBlocked && targetUserId === actorUserId) {
      throw new BadRequestException(CITY_MEMBERS_ERRORS.SELF_BLOCK_PROTECTION);
    }

    if (isBlocked) {
      await this.ensureMemberIsNotAdmin(cityId, targetUserId);
    }

    const updated = await this.prisma.userCity.update({
      where: {
        userId_cityId: {
          userId: targetUserId,
          cityId,
        },
      },
      data: {
        isBlocked,
        blockedAt: isBlocked ? new Date() : null,
        blockedById: isBlocked ? actorUserId : null,
      },
      select: {
        userId: true,
        isBlocked: true,
        blockedAt: true,
        blockedById: true,
      },
    });

    return updated;
  }

  private pickPrimaryRole(roleNames: string[]): string | null {
    for (const role of ROLE_PRIORITY) {
      if (roleNames.includes(role)) {
        return role;
      }
    }

    return roleNames[0] ?? null;
  }

  private async ensureMemberIsNotAdmin(cityId: string, targetUserId: string) {
    const adminRole = await this.prisma.role.findUnique({
      where: {
        cityId_name: {
          cityId,
          name: ROLES.ADMIN,
        },
      },
      select: {
        id: true,
      },
    });

    if (!adminRole) return;

    const targetIsAdmin = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: targetUserId,
          roleId: adminRole.id,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!targetIsAdmin) return;

    throw new BadRequestException(CITY_MEMBERS_ERRORS.ADMIN_BLOCK_PROTECTION);
  }
}
