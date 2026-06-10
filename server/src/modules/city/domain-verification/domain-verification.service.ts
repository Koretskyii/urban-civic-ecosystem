import { Injectable, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CITY_ERRORS,
  CITY_SUCCESS_MESSAGES,
} from '../../rbac/constants/city.const';
import { normalizeDomain } from '../helpers/city.helpers';

const resolveTxt = promisify(dns.resolveTxt);
const normalizeTxtValue = (value: string) => value.trim().replace(/^"|"$/g, '');

@Injectable()
export class DomainVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async generateDomainToken(requesterId: string, domain: string) {
    const normalizedDomain = normalizeDomain(domain);
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedDomain)) {
      throw new BadRequestException('Invalid domain');
    }

    const token = `urban-civic-ecosystem=${crypto.randomUUID().toString()}`;
    const verification = await this.prisma.domainVerification.create({
      data: {
        requesterId,
        domain: normalizedDomain,
        token,
      },
      select: {
        id: true,
        domain: true,
        token: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return verification;
  }

  async verifyDomain(requesterId: string, domain: string, token: string) {
    const normalizedDomain = normalizeDomain(domain);
    try {
      const verification = await this.prisma.domainVerification.findFirst({
        where: {
          requesterId,
          domain: normalizedDomain,
          token,
        },
      });

      if (!verification) {
        throw new BadRequestException(CITY_ERRORS.TOKEN_NOT_FOUND);
      }

      const txtRecords = await Promise.allSettled([
        resolveTxt(`_urban-civic-verify.${normalizedDomain}`),
        resolveTxt(normalizedDomain),
      ]);
      const resolvedRecords = txtRecords.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      );
      const tokenFound = resolvedRecords.some((recordChunks) => {
        const joinedRecord = normalizeTxtValue(recordChunks.join(''));
        return (
          joinedRecord === token ||
          recordChunks.some((chunk) => normalizeTxtValue(chunk) === token)
        );
      });

      if (!tokenFound) {
        throw new BadRequestException(CITY_ERRORS.DNS_RECORD_NOT_FOUND);
      }

      const verifiedAt = new Date();
      const updatedVerification = await this.prisma.domainVerification.update({
        where: { id: verification.id },
        data: { verifiedAt },
        select: {
          id: true,
          domain: true,
          token: true,
          verifiedAt: true,
        },
      });

      return {
        success: true,
        message: CITY_SUCCESS_MESSAGES.DOMAIN_VERIFIED,
        ...updatedVerification,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Domain verification failed for ${normalizedDomain}: ${errorMessage}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(CITY_ERRORS.DNS_RECORD_NOT_FOUND);
    }
  }
}
