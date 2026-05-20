import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CityInitData } from '@/types/city.types';
import { Injectable, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { R2StorageService } from '../r2/r2.service';
import { ROLES } from '../rbac/constants/roles.const';
import {
  CITY_ERRORS,
  CITY_SUCCESS_MESSAGES,
} from '../rbac/constants/city.const';
import { ALERT_TYPES } from '@/shared/constants/alerts.const';
import { DEFAULT_CITY_DEPARTMENTS } from '@/shared/constants/departments.const';

interface CityTransactionData {
  name: string;
  region: string;
  cityDomain?: {
    create: {
      domainName: string;
      token: string;
      ownerId: string;
    };
  };
}

interface PrepareNewCityParams {
  userId: string;
  cityId: string;
  cityName: string;
}

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class CityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2StorageService: R2StorageService,
  ) {}
  private tokenStore = new Map<string, string>(); // TODO: Replace with persistent storage in production

  generateDomainToken(domain: string) {
    const token = `urban-civic-ecosystem=${crypto.randomUUID().toString()}`;
    // Store the token associated with the domain
    this.tokenStore.set(domain, token);
    return { token, domain };
  }

  async verifyDomain(domain: string, token: string) {
    try {
      const storedToken = this.tokenStore.get(domain);
      if (!storedToken) {
        throw new BadRequestException(CITY_ERRORS.TOKEN_NOT_FOUND);
      }

      if (storedToken !== token) {
        throw new BadRequestException(CITY_ERRORS.INVALID_TOKEN);
      }

      const txtRecords = await resolveTxt(`_urban-civic-verify.${domain}`);

      const flatRecords = txtRecords.flat();
      const tokenFound = flatRecords.some((record) => record === token);

      if (!tokenFound) {
        throw new BadRequestException(CITY_ERRORS.DNS_RECORD_NOT_FOUND);
      }

      this.tokenStore.delete(domain);

      return {
        success: true,
        message: CITY_SUCCESS_MESSAGES.DOMAIN_VERIFIED,
        domain,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Domain verification failed for ${domain}: ${errorMessage}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(CITY_ERRORS.DNS_RECORD_NOT_FOUND);
    }
  }

  async getAllCities() {
    return this.prisma.city.findMany({
      select: {
        id: true,
        name: true,
        region: true,
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
    const city = await this.prisma.city.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        region: true,
        cityDomain: {
          select: { domainName: true },
        },
      },
    });

    if (!city) {
      throw new BadRequestException(CITY_ERRORS.CITY_NOT_FOUND);
    }

    return city;
  }

  async joinCity(cityId: string, userId: string) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
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

      // Also join the main community
      const mainCommunity = await tx.community.findFirst({
        where: { cityId },
      });

      if (mainCommunity) {
        await tx.communityMember.create({
          data: {
            userId,
            communityId: mainCommunity.id,
          },
        });
      }

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

  async initializeCityEnvironment(
    data: CityInitData,
    document: Express.Multer.File,
  ) {
    const { name, region, domain, userId } = data;

    if (!name || !region) {
      throw new BadRequestException(CITY_ERRORS.NAME_AND_REGION_REQUIRED);
    }

    if (!userId) {
      throw new BadRequestException(CITY_ERRORS.USER_ID_REQUIRED);
    }

    const existingCity = await this.prisma.city.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        region: { equals: region, mode: 'insensitive' },
      },
    });

    if (existingCity) {
      throw new BadRequestException(
        CITY_ERRORS.CITY_ALREADY_EXISTS(name, region),
      );
    }

    if (domain) {
      const existingDomain = await this.prisma.cityDomain.findUnique({
        where: { domainName: domain },
      });

      if (existingDomain) {
        throw new BadRequestException(
          CITY_ERRORS.DOMAIN_ALREADY_REGISTERED(domain),
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const cityData: CityTransactionData = {
        name,
        region,
      };

      if (domain && userId) {
        cityData.cityDomain = {
          create: {
            domainName: domain,
            token: this.tokenStore.get(domain) || '',
            ownerId: userId,
          },
        };
      }

      const city = await tx.city.create({
        data: cityData,
        include: {
          cityDomain: true,
        },
      });

      const uploadedFile =
        await this.r2StorageService.uploadCityVerificationDocument({
          cityId: city.id,
          fileName: document.originalname,
          mimeType: document.mimetype,
          buffer: document.buffer,
        });

      await tx.attachment.create({
        data: {
          fileName: document.originalname,
          mimeType: document.mimetype,
          url: uploadedFile.url,
          type: 'DOCUMENT',
          entityId: city.id,
          entityType: 'CITY_VERIFICATION',
        },
      });

      await tx.role.createMany({
        data: [
          {
            name: ROLES.ADMIN,
            cityId: city.id,
          },
          {
            name: ROLES.CITIZEN,
            cityId: city.id,
          },
          {
            name: ROLES.ORGANIZER,
            cityId: city.id,
          },
          {
            name: ROLES.MUNICIPALITY,
            cityId: city.id,
          },
        ],
        skipDuplicates: true,
      });

      const adminRole = await tx.role.findFirst({
        where: {
          name: ROLES.ADMIN,
          cityId: city.id,
        },
      });

      if (!adminRole) {
        throw new Error(CITY_ERRORS.ADMIN_ROLE_NOT_FOUND);
      }

      const cityUser = await tx.userCity.create({
        data: {
          userId: userId,
          cityId: city.id,
        },
      });

      await tx.userRole.create({
        data: {
          userId: cityUser.userId,
          roleId: adminRole.id,
        },
      });

      await this.prepareNewCity(tx, {
        userId,
        cityId: city.id,
        cityName: city.name,
      });

      return {
        success: true,
        message: CITY_SUCCESS_MESSAGES.INITIALIZED,
        city,
      };
    });
  }

  private async prepareNewCity(
    tx: Prisma.TransactionClient,
    params: PrepareNewCityParams,
  ) {
    const txWithDepartmentDelegate = tx as Prisma.TransactionClient & {
      department: {
        createMany: (args: {
          data: Array<{
            cityId: string;
            name: string;
            type: string;
            description?: string;
          }>;
          skipDuplicates: boolean;
        }) => Promise<unknown>;
      };
    };
    const { userId, cityId, cityName } = params;
    const community = await tx.community.create({
      data: {
        cityId: cityId,
        name: `${cityName} - Загальна спільнота`,
        description: `Загальна спільнота для мешканців міста ${cityName}`,
      },
      select: {
        id: true,
      },
    });

    await tx.communityMember.create({
      data: {
        userId: userId,
        communityId: community.id,
      },
    });

    const chat = await tx.chat.create({
      data: {
        cityId: cityId,
        communityId: community.id,
        contextType: 'community',
      },
      select: {
        id: true,
      },
    });

    await tx.message.create({
      data: {
        authorId: userId,
        chatId: chat.id,
        content: `Вітаємо у спільноті міста ${cityName}!`,
      },
    });

    await tx.post.create({
      data: {
        authorId: userId,
        communityId: community.id,
        content: `Вітаємо у спільноті міста ${cityName}!`,
      },
    });

    const alertTypes = await tx.alertType.findMany();

    const alertSubscriptionData = alertTypes.map((type: { id: string }) => ({
      userId: userId,
      cityId: cityId,
      alertTypeId: type.id,
    }));

    await tx.alertSubscription.createMany({
      data: alertSubscriptionData,
    });

    const otherAlertType = await tx.alertType.findFirst({
      where: {
        name: ALERT_TYPES.OTHER,
      },
    });

    if (!otherAlertType) {
      throw new Error(CITY_ERRORS.ALERT_TYPE_NOT_FOUND);
    }

    await tx.alert.create({
      data: {
        cityId: cityId,
        alertTypeId: otherAlertType.id,
        title: `Термінові оголошення міста ${cityName}`,
        content: `Так будуть виглядати термінові оголошення в межах даного міста.`,
      },
    });

    await tx.generalNews.create({
      data: {
        cityId: cityId,
        title: `Перші новини міста ${cityName}`,
        content: `Так будуть виглядати загальні новини міста ${cityName}.`,
        publisherId: userId,
      },
    });

    await txWithDepartmentDelegate.department.createMany({
      data: DEFAULT_CITY_DEPARTMENTS.map((department) => ({
        cityId,
        ...department,
      })),
      skipDuplicates: true,
    });
  }
}
