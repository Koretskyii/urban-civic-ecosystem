import { Injectable, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class CityService {
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
        throw new BadRequestException(
          'Токен не знайдено. Спочатку згенеруйте токен для цього домену.',
        );
      }

      if (storedToken !== token) {
        throw new BadRequestException('Невірний токен.');
      }

      const txtRecords = await resolveTxt(`_urban-civic-verify.${domain}`);

      const flatRecords = txtRecords.flat();
      const tokenFound = flatRecords.some((record) => record === token);

      if (!tokenFound) {
        throw new BadRequestException(
          'DNS TXT запис не знайдено. Переконайтеся, що ви додали запис _urban-civic-verify з правильним токеном і зачекайте поширення DNS (5-10 хвилин).',
        );
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
      throw new BadRequestException(
        `Не вдалося перевірити DNS записи для домену ${domain}. Переконайтеся, що TXT запис додано та DNS поширено.`,
      );
    }
  }
}
