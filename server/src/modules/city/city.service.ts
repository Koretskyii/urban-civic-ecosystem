import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CityCreationRequestStatus } from '@/generated/prisma/enums';
import { CityInitData } from '@/types/city.types';
import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
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
  centerLat?: number;
  centerLng?: number;
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

interface ProvisionApprovedCityParams {
  requesterId: string;
  name: string;
  region: string;
  centerLat?: number | null;
  centerLng?: number | null;
  domain?: string | null;
  verificationAttachmentId?: string;
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
          entityId: id,
          entityType: 'CITY_VERIFICATION',
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

  async getCurrentCityCreationRequest(requesterId: string) {
    return this.prisma.cityCreationRequest.findFirst({
      where: {
        requesterId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        region: true,
        centerLat: true,
        centerLng: true,
        domain: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
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

  async createCityCreationRequest(
    requesterId: string,
    data: CityInitData,
    document: Express.Multer.File,
  ) {
    const { name, region, domain, centerLat, centerLng } = data;
    const normalizedName = name?.trim().replace(/\s+/g, ' ');
    const normalizedRegion = region?.trim().replace(/\s+/g, ' ');
    const normalizedDomain = domain?.trim().toLowerCase();

    if (!normalizedName || !normalizedRegion) {
      throw new BadRequestException(CITY_ERRORS.NAME_AND_REGION_REQUIRED);
    }

    const existingRequesterPendingRequest =
      await this.prisma.cityCreationRequest.findFirst({
        where: {
          requesterId,
          status: CityCreationRequestStatus.PENDING,
        },
        select: {
          id: true,
        },
      });

    if (existingRequesterPendingRequest) {
      throw new BadRequestException(
        'You already have a city creation request pending review',
      );
    }

    const existingCity = await this.prisma.city.findFirst({
      where: {
        deletedAt: null,
        name: { equals: normalizedName, mode: 'insensitive' },
        region: { equals: normalizedRegion, mode: 'insensitive' },
      },
    });

    if (existingCity) {
      throw new BadRequestException(
        CITY_ERRORS.CITY_ALREADY_EXISTS(normalizedName, normalizedRegion),
      );
    }

    const existingPendingRequest =
      await this.prisma.cityCreationRequest.findFirst({
        where: {
          status: CityCreationRequestStatus.PENDING,
          name: { equals: normalizedName, mode: 'insensitive' },
          region: { equals: normalizedRegion, mode: 'insensitive' },
        },
      });

    if (existingPendingRequest) {
      throw new BadRequestException(
        `City creation request for ${normalizedName}, ${normalizedRegion} is already pending review`,
      );
    }

    if (normalizedDomain) {
      const [existingDomain, existingDomainRequest] = await Promise.all([
        this.prisma.cityDomain.findUnique({
          where: { domainName: normalizedDomain },
        }),
        this.prisma.cityCreationRequest.findFirst({
          where: {
            status: CityCreationRequestStatus.PENDING,
            domain: { equals: normalizedDomain, mode: 'insensitive' },
          },
        }),
      ]);

      if (existingDomain || existingDomainRequest) {
        throw new BadRequestException(
          CITY_ERRORS.DOMAIN_ALREADY_REGISTERED(normalizedDomain),
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.cityCreationRequest.create({
        data: {
          requesterId,
          name: normalizedName,
          region: normalizedRegion,
          centerLat,
          centerLng,
          domain: normalizedDomain || null,
        },
        select: {
          id: true,
          name: true,
          region: true,
          centerLat: true,
          centerLng: true,
          domain: true,
          status: true,
          createdAt: true,
        },
      });

      const uploadedFile =
        await this.r2StorageService.uploadCityCreationRequestDocument({
          requestId: request.id,
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
          entityId: request.id,
          entityType: 'CITY_CREATION_REQUEST',
          cityCreationRequestId: request.id,
        },
      });

      return {
        success: true,
        message: 'City creation request submitted for review',
        request,
      };
    });
  }

  async provisionApprovedCity(
    tx: Prisma.TransactionClient,
    params: ProvisionApprovedCityParams,
  ) {
    const cityData: CityTransactionData = {
      name: params.name,
      region: params.region,
    };

    if (typeof params.centerLat === 'number') {
      cityData.centerLat = params.centerLat;
    }

    if (typeof params.centerLng === 'number') {
      cityData.centerLng = params.centerLng;
    }

    if (params.domain) {
      cityData.cityDomain = {
        create: {
          domainName: params.domain,
          token:
            this.tokenStore.get(params.domain) ||
            `city-domain=${crypto.randomUUID().toString()}`,
          ownerId: params.requesterId,
        },
      };
    }

    const city = await tx.city.create({
      data: cityData,
      include: {
        cityDomain: true,
      },
    });

    if (params.verificationAttachmentId) {
      await tx.attachment.update({
        where: { id: params.verificationAttachmentId },
        data: {
          entityId: city.id,
          entityType: 'CITY_VERIFICATION',
          cityCreationRequestId: null,
        },
      });
    }

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
        userId: params.requesterId,
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
      userId: params.requesterId,
      cityId: city.id,
      cityName: city.name,
    });

    if (params.domain) {
      this.tokenStore.delete(params.domain);
    }

    return city;
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
        isDefault: true,
        ...department,
      })),
      skipDuplicates: true,
    });
  }
}
