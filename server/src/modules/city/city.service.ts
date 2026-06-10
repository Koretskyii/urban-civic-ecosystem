import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { R2StorageService } from '../r2/r2.service';
import { ROLES } from '../rbac/constants/roles.const';
import { CITY_ERRORS } from '../rbac/constants/city.const';

@Injectable()
export class CityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  async getAllCities() {
    return this.prisma.city.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        region: true,
        centerLat: true,
        centerLng: true,
        cityDomain: {
          select: {
            domainName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCityById(id: string) {
    const [city, verificationDocument] = await Promise.all([
      this.prisma.city.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          region: true,
          centerLat: true,
          centerLng: true,
          createdAt: true,
          updatedAt: true,
          cityDomain: {
            select: { domainName: true },
          },
        },
      }),
      this.prisma.attachment.findFirst({
        where: {
          cityId: id,
          type: 'DOCUMENT',
        },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          url: true,
          type: true,
          uploadedAt: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      }),
    ]);

    if (!city) {
      throw new BadRequestException(CITY_ERRORS.CITY_NOT_FOUND);
    }

    return {
      ...city,
      domain: city.cityDomain?.domainName ?? null,
      verificationDocument: verificationDocument
        ? {
            ...verificationDocument,
            url: this.r2StorageService.toPublicUrl(verificationDocument.url),
          }
        : null,
    };
  }

  async joinCity(cityId: string, userId: string) {
    const city = await this.prisma.city.findFirst({
      where: { id: cityId, deletedAt: null },
    });

    if (!city) {
      throw new BadRequestException(CITY_ERRORS.CITY_NOT_FOUND);
    }

    const existingMembership = await this.prisma.userCity.findUnique({
      where: {
        userId_cityId: {
          userId,
          cityId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.isBlocked) {
        throw new ForbiddenException('User is blocked in this city');
      }

      return { success: true, message: 'Already joined' };
    }

    const citizenRole = await this.prisma.role.findFirst({
      where: {
        cityId,
        name: ROLES.CITIZEN,
      },
    });

    if (!citizenRole) {
      throw new BadRequestException('Citizen role not found for this city');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userCity.create({
        data: {
          userId,
          cityId,
        },
      });

      await tx.userRole.create({
        data: {
          userId,
          roleId: citizenRole.id,
        },
      });

      // Subscribe to all alert types for this city by default
      const alertTypes = await tx.alertType.findMany();
      if (alertTypes.length > 0) {
        const alertSubscriptionData = alertTypes.map((type) => ({
          userId,
          cityId,
          alertTypeId: type.id,
        }));

        await tx.alertSubscription.createMany({
          data: alertSubscriptionData,
          skipDuplicates: true,
        });
      }
    });

    return { success: true, message: 'Successfully joined city' };
  }
}
