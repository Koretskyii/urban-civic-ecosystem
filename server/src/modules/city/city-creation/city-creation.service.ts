import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { CityCreationRequestStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { R2StorageService } from '../../r2/r2.service';
import { ROLES } from '../../rbac/constants/roles.const';
import { CITY_ERRORS } from '../../rbac/constants/city.const';
import { ALERT_TYPES } from '@/shared/constants/alerts.const';
import { DEFAULT_CITY_DEPARTMENTS } from '@/shared/constants/departments.const';
import { withDomainVerifiedAt } from '@/utils';
import { CityInitData } from '../types/city.types';
import { normalizeDomain } from '../helpers/city.helpers';

interface CityTransactionData {
  name: string;
  region: string;
  centerLat?: number;
  centerLng?: number;
  cityDomain?: {
    create: {
      domainName: string;
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

@Injectable()
export class CityCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  async getCurrentCityCreationRequest(requesterId: string) {
    const request = await this.prisma.cityCreationRequest.findFirst({
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
        domainVerification: { select: { verifiedAt: true } },
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

    return request ? withDomainVerifiedAt(request) : null;
  }

  async createCityCreationRequest(
    requesterId: string,
    data: CityInitData,
    document: Express.Multer.File,
  ) {
    const { name, region, domain, centerLat, centerLng } = data;
    const normalizedName = name?.trim().replace(/\s+/g, ' ');
    const normalizedRegion = region?.trim().replace(/\s+/g, ' ');
    const normalizedDomain = normalizeDomain(domain);

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

    const existingRequesterDuplicateRequest =
      await this.prisma.cityCreationRequest.findFirst({
        where: {
          requesterId,
          name: { equals: normalizedName, mode: 'insensitive' },
          region: { equals: normalizedRegion, mode: 'insensitive' },
        },
        select: {
          id: true,
        },
      });

    if (existingRequesterDuplicateRequest) {
      throw new BadRequestException(
        `You already submitted a city creation request for ${normalizedName}, ${normalizedRegion}`,
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

    let domainVerification: { id: string; verifiedAt: Date | null } | null =
      null;

    if (normalizedDomain) {
      const [existingDomain, existingDomainRequest, verifiedDomain] =
        await Promise.all([
          this.prisma.cityDomain.findUnique({
            where: { domainName: normalizedDomain },
          }),
          this.prisma.cityCreationRequest.findFirst({
            where: {
              status: CityCreationRequestStatus.PENDING,
              domain: { equals: normalizedDomain, mode: 'insensitive' },
            },
          }),
          this.prisma.domainVerification.findFirst({
            where: {
              requesterId,
              domain: normalizedDomain,
              verifiedAt: { not: null },
            },
            orderBy: {
              verifiedAt: 'desc',
            },
            select: {
              id: true,
              verifiedAt: true,
            },
          }),
        ]);

      if (existingDomain || existingDomainRequest) {
        throw new BadRequestException(
          CITY_ERRORS.DOMAIN_ALREADY_REGISTERED(normalizedDomain),
        );
      }

      domainVerification = verifiedDomain;
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
          domainVerificationId: domainVerification?.id,
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
          cityCreationRequestId: request.id,
        },
      });

      return {
        success: true,
        message: 'City creation request submitted for review',
        request: {
          ...request,
          domainVerifiedAt: domainVerification?.verifiedAt ?? null,
        },
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
          cityId: city.id,
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
