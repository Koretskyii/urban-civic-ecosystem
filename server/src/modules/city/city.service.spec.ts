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
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [[token]]);
        return {};
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
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [['wrong-token']]);
        return {};
      });

      await expect(service.verifyDomain(domain, token)).rejects.toThrow(
        'DNS TXT запис не знайдено',
      );
    });

    it('should throw error on DNS lookup failure', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(new Error('ENOTFOUND'), []);
        return {};
      });

      await expect(service.verifyDomain(domain, token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete token after successful verification', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [[token]]);
        return {};
      });

      await service.verifyDomain(domain, token);

      await expect(service.verifyDomain(domain, token)).rejects.toThrow(
        'Токен не знайдено',
      );
    });

    it('should handle multiple TXT records', async () => {
      mockResolveTxt.mockImplementation((hostname, callback) => {
        callback(null, [['some-other-record'], [token], ['another-record']]);
        return {};
      });

      const result = await service.verifyDomain(domain, token);

      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentCityCreationRequest', () => {
    it('should return the current city creation request for requester', async () => {
      const currentRequest = {
        id: 'request-1',
        name: 'Kyiv',
        region: 'Kyiv Oblast',
        centerLat: 50.45,
        centerLng: 30.52,
        domain: 'kyiv.example.com',
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
      expect(result).toEqual(currentRequest);
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
  });
});
