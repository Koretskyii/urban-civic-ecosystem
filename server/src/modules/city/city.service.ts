import { PrismaService } from '@/prisma/prisma.service';
import { CityInitData } from '@/types/city.types';
import { Injectable, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { R2StorageService } from '../r2/r2.service';
import { ROLES } from '../rbac/constants/roles.const';
import { CITY_ERRORS } from '../rbac/constants/city.const';

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
        message: 'Домен успішно верифіковано!',
        domain,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        console.error(
          `Domain verification failed for ${domain}: ${error.message}`,
        );
        throw error;
      }
      console.error(
        `Domain verification failed for ${domain}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // DNS lookup failed
      throw new BadRequestException(CITY_ERRORS.DNS_LOOKUP_FAILED(domain));
    }
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
      const cityData: {
        name: string;
        region: string;
        cityDomain?: {
          create: {
            domainName: string;
            token: string;
            ownerId: string;
          };
        };
      } = {
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

      return { success: true, message: 'City environment initialized', city };
    });
  }
}
