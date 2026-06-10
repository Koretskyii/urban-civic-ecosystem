import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CityCreationService } from './city-creation/city-creation.service';
import { PrismaService } from '@/prisma/prisma.service';
import { R2StorageService } from '../r2/r2.service';
import { CityCreationRequestStatus } from '@/generated/prisma/enums';

describe('CityCreationService', () => {
  let service: CityCreationService;
  type CityCreationRequestFindFirstArgs = {
    where: {
      requesterId: string;
      status: CityCreationRequestStatus;
    };
    select: {
      id: boolean;
    };
  };
  const mockPrismaService = {
    $transaction: jest.fn(),
    cityCreationRequest: {
      findFirst: jest.fn(),
    },
  };
  const mockR2StorageService = {
    uploadCityCreationRequestDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityCreationService,
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

    service = module.get<CityCreationService>(CityCreationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
