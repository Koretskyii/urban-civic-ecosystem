import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CityCreationService } from '@/modules/city/city-creation/city-creation.service';
import {
  CityCreationRequestStatus,
  SystemRole,
} from '@/generated/prisma/enums';
import {
  GetAdminCitiesQueryDto,
  GetAdminUsersQueryDto,
  GetCityCreationRequestsQueryDto,
  RejectCityCreationRequestDto,
  UpdateAdminCityDto,
  UpdateUserSystemRoleDto,
} from './dto';
import { CITY_ERRORS } from '@/modules/rbac/constants/city.const';
import { withDomainVerifiedAt } from '@/utils';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

const getPagination = (page?: number, limit?: number) => {
  const safePage = page ?? DEFAULT_PAGE;
  const safeLimit = limit ?? DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityCreationService: CityCreationService,
  ) {}

  async listCityCreationRequests(query: GetCityCreationRequestsQueryDto) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const search = query.search?.trim();
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { region: { contains: search, mode: 'insensitive' as const } },
              {
                requester: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                requester: {
                  email: { contains: search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.cityCreationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          region: true,
          centerLat: true,
          centerLng: true,
          domain: true,
          domainVerification: { select: { verifiedAt: true } },
          status: true,
          rejectionReason: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              url: true,
              type: true,
              uploadedAt: true,
            },
            orderBy: { uploadedAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.cityCreationRequest.count({ where }),
    ]);

    return {
      items: items.map(withDomainVerifiedAt),
      total,
      page,
      limit,
    };
  }

  async getCityCreationRequest(id: string) {
    const request = await this.prisma.cityCreationRequest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        region: true,
        centerLat: true,
        centerLng: true,
        domain: true,
        domainVerification: { select: { verifiedAt: true } },
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            url: true,
            type: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('City creation request not found');
    }

    return withDomainVerifiedAt(request);
  }

  async listCities(query: GetAdminCitiesQueryDto) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const search = query.search?.trim();
    const where = {
      ...(query.includeDeleted ? {} : { deletedAt: null }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { region: { contains: search, mode: 'insensitive' as const } },
              {
                cityDomain: {
                  domainName: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.city.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          region: true,
          centerLat: true,
          centerLng: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          cityDomain: {
            select: {
              domainName: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
      this.prisma.city.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateCity(id: string, actorId: string, dto: UpdateAdminCityDto) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: { cityDomain: true },
    });

    if (!city || city.deletedAt) {
      throw new NotFoundException(CITY_ERRORS.CITY_NOT_FOUND);
    }

    if (dto.name || dto.region) {
      const nextName = dto.name ?? city.name;
      const nextRegion = dto.region ?? city.region;
      const duplicate = await this.prisma.city.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          name: { equals: nextName, mode: 'insensitive' },
          region: { equals: nextRegion, mode: 'insensitive' },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          CITY_ERRORS.CITY_ALREADY_EXISTS(nextName, nextRegion),
        );
      }
    }

    if (dto.domain && dto.domain !== city.cityDomain?.domainName) {
      const existingDomain = await this.prisma.cityDomain.findUnique({
        where: { domainName: dto.domain },
      });

      if (existingDomain) {
        throw new BadRequestException(
          CITY_ERRORS.DOMAIN_ALREADY_REGISTERED(dto.domain),
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.city.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.region ? { region: dto.region } : {}),
          ...(dto.centerLat !== undefined ? { centerLat: dto.centerLat } : {}),
          ...(dto.centerLng !== undefined ? { centerLng: dto.centerLng } : {}),
        },
      });

      if (dto.domain !== undefined) {
        if (dto.domain.length === 0) {
          await tx.cityDomain.deleteMany({ where: { cityId: id } });
        } else {
          await tx.cityDomain.upsert({
            where: { cityId: id },
            update: { domainName: dto.domain },
            create: {
              cityId: id,
              domainName: dto.domain,
              ownerId: city.cityDomain?.ownerId ?? actorId,
            },
          });
        }
      }

      return tx.city.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          region: true,
          centerLat: true,
          centerLng: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          cityDomain: {
            select: { domainName: true },
          },
        },
      });
    });
  }

  async softDeleteCity(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!city || city.deletedAt) {
      throw new NotFoundException(CITY_ERRORS.CITY_NOT_FOUND);
    }

    return this.prisma.city.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        deletedAt: true,
      },
    });
  }

  async listUsers(query: GetAdminUsersQueryDto) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const search = query.search?.trim();
    const where = {
      ...(query.systemRole ? { systemRole: query.systemRole } : {}),
      ...(query.isBlocked !== undefined ? { isBlocked: query.isBlocked } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          provider: true,
          systemRole: true,
          isBlocked: true,
          blockedAt: true,
          blockedById: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async blockUser(id: string, reviewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isBlocked: true, systemRole: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isBlocked) {
      throw new BadRequestException('User is already blocked');
    }

    if (user.systemRole === SystemRole.ADMIN) {
      throw new BadRequestException('Cannot block a system admin');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedById: reviewerId,
      },
      select: {
        id: true,
        isBlocked: true,
        blockedAt: true,
        blockedById: true,
        updatedAt: true,
      },
    });
  }

  async unblockUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isBlocked: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBlocked) {
      throw new BadRequestException('User is not blocked');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedById: null,
      },
      select: {
        id: true,
        isBlocked: true,
        updatedAt: true,
      },
    });
  }

  async updateUserSystemRole(
    id: string,
    reviewerId: string,
    dto: UpdateUserSystemRoleDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        systemRole: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.systemRole === SystemRole.ADMIN &&
      dto.systemRole !== SystemRole.ADMIN
    ) {
      if (user.id === reviewerId) {
        throw new BadRequestException(
          'Cannot remove your own system admin role',
        );
      }

      const adminCount = await this.prisma.user.count({
        where: { systemRole: SystemRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last system admin');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { systemRole: dto.systemRole },
      select: {
        id: true,
        name: true,
        email: true,
        systemRole: true,
        updatedAt: true,
      },
    });
  }

  async approveCityCreationRequest(requestId: string, reviewerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.cityCreationRequest.findUnique({
        where: { id: requestId },
        include: {
          attachments: {
            orderBy: { uploadedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!request) {
        throw new NotFoundException('City creation request not found');
      }

      if (request.status !== CityCreationRequestStatus.PENDING) {
        throw new BadRequestException(
          'City creation request was already reviewed',
        );
      }

      const existingCity = await tx.city.findFirst({
        where: {
          deletedAt: null,
          name: { equals: request.name, mode: 'insensitive' },
          region: { equals: request.region, mode: 'insensitive' },
        },
      });

      if (existingCity) {
        throw new BadRequestException(
          CITY_ERRORS.CITY_ALREADY_EXISTS(request.name, request.region),
        );
      }

      if (request.domain) {
        const existingDomain = await tx.cityDomain.findUnique({
          where: { domainName: request.domain },
        });

        if (existingDomain) {
          throw new BadRequestException(
            CITY_ERRORS.DOMAIN_ALREADY_REGISTERED(request.domain),
          );
        }
      }

      const verificationAttachment = request.attachments[0];
      const city = await this.cityCreationService.provisionApprovedCity(tx, {
        requesterId: request.requesterId,
        name: request.name,
        region: request.region,
        centerLat: request.centerLat,
        centerLng: request.centerLng,
        domain: request.domain,
        verificationAttachmentId: verificationAttachment?.id,
      });

      const reviewedRequest = await tx.cityCreationRequest.update({
        where: { id: request.id },
        data: {
          status: CityCreationRequestStatus.APPROVED,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: null,
          cityId: city.id,
        },
        select: {
          id: true,
          cityId: true,
          status: true,
          reviewedAt: true,
          reviewedById: true,
        },
      });

      return {
        success: true,
        request: reviewedRequest,
        city,
      };
    });
  }

  async rejectCityCreationRequest(
    requestId: string,
    reviewerId: string,
    dto: RejectCityCreationRequestDto,
  ) {
    const request = await this.prisma.cityCreationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });

    if (!request) {
      throw new NotFoundException('City creation request not found');
    }

    if (request.status !== CityCreationRequestStatus.PENDING) {
      throw new BadRequestException(
        'City creation request was already reviewed',
      );
    }

    const reviewedRequest = await this.prisma.cityCreationRequest.update({
      where: { id: request.id },
      data: {
        status: CityCreationRequestStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        reviewedById: true,
        rejectionReason: true,
      },
    });

    return {
      success: true,
      request: reviewedRequest,
    };
  }
}
