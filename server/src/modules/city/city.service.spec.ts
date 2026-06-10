import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CityService } from './city.service';
import * as dns from 'dns';
import { PrismaService } from '@/prisma/prisma.service';
import { R2StorageService } from '../r2/r2.service';
import { CityCreationRequestStatus } from '@/generated/prisma/enums';

jest.mock('dns', () => ({
  resolveTxt: jest.fn(),
}));

describe('CityService', () => {
  let service: CityService;
  type CityCreationRequestFindFirstArgs = {
    where: {
      requesterId: string;
      status: CityCreationRequestStatus;
    };
    select: {
      id: boolean;
    };
  };
  const mockResolveTxt = dns.resolveTxt as jest.MockedFunction<
    typeof dns.resolveTxt
  >;
  const mockPrismaService = {
    $transaction: jest.fn(),
    cityCreationRequest: {
      findFirst: jest.fn(),
    },
    domainVerification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const mockR2StorageService = {
    uploadCityVerificationDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: R2StorageService,
          useValue: mockR2StorageService,
        },
      ],
    }).compile();

    service = module.get<CityService>(CityService);
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

  describe('getCurrentCityCreationRequest', () => {
    it('should return the current city creation request for requester', async () => {
      const verifiedAt = new Date('2026-06-07T11:00:00.000Z');
      const currentRequest = {
        id: 'request-1',
        name: 'Kyiv',
        region: 'Kyiv Oblast',
        centerLat: 50.45,
        centerLng: 30.52,
        domain: 'kyiv.example.com',
        domainVerification: { verifiedAt },
        status: CityCreationRequestStatus.PENDING,
        rejectionReason: null,
        reviewedAt: null,
        createdAt: new Date('2026-06-07T10:00:00.000Z'),
        updatedAt: new Date('2026-06-07T10:00:00.000Z'),
        city: null,
      };
      mockPrismaService.cityCreationRequest.findFirst.mockResolvedValue(
        currentRequest,
      );

      const result = await service.getCurrentCityCreationRequest('user-1');

      expect(
        mockPrismaService.cityCreationRequest.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          requesterId: 'user-1',
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
      const { domainVerification: _, ...rest } = currentRequest;
      expect(result).toEqual({ ...rest, domainVerifiedAt: verifiedAt });
    });
  });

  describe('createCityCreationRequest', () => {
    it('should reject a second pending request from the same requester', async () => {
      mockPrismaService.cityCreationRequest.findFirst.mockResolvedValue({
        id: 'request-1',
      });

      await expect(
        service.createCityCreationRequest(
          'user-1',
          {
            name: 'Kyiv',
            region: 'Kyiv Oblast',
            domain: 'kyivcity.gov.ua',
          },
          {
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
            buffer: Buffer.from('document'),
          } as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockPrismaService.cityCreationRequest.findFirst,
      ).toHaveBeenCalledTimes(1);
      const [findFirstArgs] = mockPrismaService.cityCreationRequest.findFirst
        .mock.calls[0] as [CityCreationRequestFindFirstArgs];
      expect(findFirstArgs).toEqual({
        where: {
          requesterId: 'user-1',
          status: CityCreationRequestStatus.PENDING,
        },
        select: {
          id: true,
        },
      });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should reject duplicate city creation request from the same requester', async () => {
      mockPrismaService.cityCreationRequest.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'request-1' });

      await expect(
        service.createCityCreationRequest(
          'user-1',
          {
            name: 'Kyiv',
            region: 'Kyiv Oblast',
          },
          {
            originalname: 'document.pdf',
            mimetype: 'application/pdf',
            buffer: Buffer.from('document'),
          } as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockPrismaService.cityCreationRequest.findFirst,
      ).toHaveBeenNthCalledWith(2, {
        where: {
          requesterId: 'user-1',
          name: { equals: 'Kyiv', mode: 'insensitive' },
          region: { equals: 'Kyiv Oblast', mode: 'insensitive' },
        },
        select: {
          id: true,
        },
      });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});
