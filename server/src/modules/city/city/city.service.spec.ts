import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CityService } from './city.service';
import * as dns from 'dns';

// Mock dns module
jest.mock('dns', () => ({
  resolveTxt: jest.fn(),
}));

describe('CityService', () => {
  let service: CityService;
  const mockResolveTxt = dns.resolveTxt as jest.MockedFunction<
    typeof dns.resolveTxt
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityService],
    }).compile();

    service = module.get<CityService>(CityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDomainToken', () => {
    it('should generate token for domain', () => {
      const domain = 'kyivcity.gov.ua';
      const result = service.generateDomainToken(domain);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('domain', domain);
      expect(result.token).toMatch(/^urban-civic-ecosystem=/);
    });

    it('token should contain UUID', () => {
      const result = service.generateDomainToken('test.com');
      const uuidPart = result.token.replace('urban-civic-ecosystem=', '');

      // Check UUID format (8-4-4-4-12)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidPart).toMatch(uuidRegex);
    });
  });

  describe('verifyDomain', () => {
    const domain = 'kyivcity.gov.ua';
    let token: string;

    beforeEach(() => {
      const result = service.generateDomainToken(domain);
      token = result.token;
    });

    it('should throw error if token was not generated', async () => {
      await expect(
        service.verifyDomain('unknown-domain.com', 'fake-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if token is invalid', async () => {
      await expect(service.verifyDomain(domain, 'wrong-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully verify domain if TXT record is found', async () => {
      // Mock DNS response with correct token
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [[token]]);
        return {} as any;
      });

      const result = await service.verifyDomain(domain, token);

      expect(result).toEqual({
        success: true,
        message: 'Домен успішно верифіковано!',
        domain,
      });
      expect(mockResolveTxt).toHaveBeenCalledWith(
        `_urban-civic-verify.${domain}`,
        expect.any(Function),
      );
    });

    it('should throw error if TXT record is not found', async () => {
      // Mock DNS response without correct token
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [['wrong-token']]);
        return {} as any;
      });

      await expect(service.verifyDomain(domain, token)).rejects.toThrow(
        'DNS TXT запис не знайдено',
      );
    });

    it('should throw error on DNS lookup failure', async () => {
      // Mock DNS error
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(new Error('ENOTFOUND'), undefined as any);
        return {} as any;
      });

      await expect(service.verifyDomain(domain, token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete token after successful verification', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [[token]]);
        return {} as any;
      });

      await service.verifyDomain(domain, token);

      // Retry verification should fail
      await expect(service.verifyDomain(domain, token)).rejects.toThrow(
        'Токен не знайдено',
      );
    });

    it('should handle multiple TXT records', async () => {
      // Mock DNS response with multiple TXT records
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [['some-other-record'], [token], ['another-record']]);
        return {} as any;
      });

      const result = await service.verifyDomain(domain, token);

      expect(result.success).toBe(true);
    });
  });
});
