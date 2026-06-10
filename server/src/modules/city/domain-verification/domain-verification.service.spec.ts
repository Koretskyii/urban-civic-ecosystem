import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { DomainVerificationService } from './domain-verification/domain-verification.service';
import { PrismaService } from '@/prisma/prisma.service';

jest.mock('dns', () => ({
  resolveTxt: jest.fn(),
}));

describe('DomainVerificationService', () => {
  let service: DomainVerificationService;
  const mockResolveTxt = dns.resolveTxt as jest.MockedFunction<
    typeof dns.resolveTxt
  >;
  const mockPrismaService = {
    domainVerification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainVerificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DomainVerificationService>(DomainVerificationService);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDomainToken', () => {
    it('should generate and persist token for domain', async () => {
      const domain = 'kyivcity.gov.ua';
      mockPrismaService.domainVerification.create.mockImplementation(
        ({
          data,
        }: {
          data: { requesterId: string; domain: string; token: string };
        }) =>
          Promise.resolve({
            id: 'verification-1',
            domain: data.domain,
            token: data.token,
            verifiedAt: null,
            createdAt: new Date('2026-06-07T10:00:00.000Z'),
          }),
      );

      const result = await service.generateDomainToken('user-1', domain);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('domain', domain);
      expect(result.token).toMatch(/^urban-civic-ecosystem=/);
      expect(mockPrismaService.domainVerification.create).toHaveBeenCalledWith({
        data: {
          requesterId: 'user-1',
          domain,
          token: result.token,
        },
        select: {
          id: true,
          domain: true,
          token: true,
          verifiedAt: true,
          createdAt: true,
        },
      });
    });

    it('token should contain UUID', async () => {
      mockPrismaService.domainVerification.create.mockImplementation(
        ({ data }: { data: { domain: string; token: string } }) =>
          Promise.resolve({
            id: 'verification-1',
            domain: data.domain,
            token: data.token,
            verifiedAt: null,
            createdAt: new Date('2026-06-07T10:00:00.000Z'),
          }),
      );
      const result = await service.generateDomainToken('user-1', 'test.com');
      const uuidPart = result.token.replace('urban-civic-ecosystem=', '');

      // Check UUID format (8-4-4-4-12)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidPart).toMatch(uuidRegex);
    });
  });

  describe('verifyDomain', () => {
    const domain = 'kyivcity.gov.ua';
    const token = 'urban-civic-ecosystem=00000000-0000-0000-0000-000000000000';

    beforeEach(() => {
      mockPrismaService.domainVerification.findFirst.mockResolvedValue({
        id: 'verification-1',
        requesterId: 'user-1',
        domain,
        token,
        verifiedAt: null,
      });
      mockPrismaService.domainVerification.update.mockImplementation(
        ({ data }: { data: { verifiedAt: Date } }) =>
          Promise.resolve({
            id: 'verification-1',
            domain,
            token,
            verifiedAt: data.verifiedAt,
          }),
      );
    });

    it('should throw error if token was not generated', async () => {
      mockPrismaService.domainVerification.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyDomain('user-1', 'unknown-domain.com', 'fake-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if token is invalid', async () => {
      mockPrismaService.domainVerification.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyDomain('user-1', domain, 'wrong-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully verify domain if TXT record is found', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [[token]]);
        return {};
      });

      const result = await service.verifyDomain('user-1', domain, token);

      expect(result).toMatchObject({
        success: true,
        message: 'Домен успішно верифіковано!',
        id: 'verification-1',
        domain,
        token,
      });
      expect(mockResolveTxt).toHaveBeenCalledWith(
        `_urban-civic-verify.${domain}`,
        expect.any(Function),
      );
    });

    it('should throw error if TXT record is not found', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [['wrong-token']]);
        return {};
      });

      await expect(
        service.verifyDomain('user-1', domain, token),
      ).rejects.toThrow('DNS TXT запис не знайдено');
    });

    it('should throw error on DNS lookup failure', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(new Error('ENOTFOUND'), []);
        return {};
      });

      await expect(
        service.verifyDomain('user-1', domain, token),
      ).rejects.toThrow(BadRequestException);
    });

    it('should persist verifiedAt after successful verification', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [[token]]);
        return {};
      });

      await service.verifyDomain('user-1', domain, token);

      expect(mockPrismaService.domainVerification.update).toHaveBeenCalledWith({
        where: { id: 'verification-1' },
        data: { verifiedAt: expect.any(Date) as Date },
        select: {
          id: true,
          domain: true,
          token: true,
          verifiedAt: true,
        },
      });
    });

    it('should handle multiple TXT records', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [['some-other-record'], [token], ['another-record']]);
        return {};
      });

      const result = await service.verifyDomain('user-1', domain, token);

      expect(result.success).toBe(true);
    });

    it('should verify token from root domain TXT record fallback', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        if (hostname === `_urban-civic-verify.${domain}`) {
          callback(new Error('ENOTFOUND'), []);
          return {};
        }

        callback(null, [[token]]);
        return {};
      });

      const result = await service.verifyDomain('user-1', domain, token);

      expect(result.success).toBe(true);
      expect(mockResolveTxt).toHaveBeenCalledWith(domain, expect.any(Function));
    });
  });
});
