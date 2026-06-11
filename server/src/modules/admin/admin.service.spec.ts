import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CityCreationService } from '@/modules/city/city-creation/city-creation.service';
import {
  CityCreationRequestStatus,
  SystemRole,
} from '@/generated/prisma/enums';

describe('AdminService', () => {
  let service: AdminService;

  type CityCreationRequestUpdateArgs = {
    where: { id: string };
    data: {
      status: CityCreationRequestStatus;
      reviewedById: string;
      reviewedAt: Date;
      rejectionReason: null;
      cityId: string;
    };
    select: {
      id: boolean;
      cityId: boolean;
      status: boolean;
      reviewedAt: boolean;
      reviewedById: boolean;
    };
  };

  const tx = {
    cityCreationRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
    cityDomain: {
      findUnique: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    ),
    cityCreationRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCityService = {
    provisionApprovedCity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CityCreationService,
          useValue: mockCityService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('approves a pending city creation request and provisions a city', async () => {
    tx.cityCreationRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'user-1',
      name: 'Kyiv',
      region: 'Kyiv Oblast',
      centerLat: 50.45,
      centerLng: 30.52,
      domain: 'kyiv.example.com',
      status: CityCreationRequestStatus.PENDING,
      attachments: [{ id: 'attachment-1' }],
    });
    tx.city.findFirst.mockResolvedValue(null);
    tx.cityDomain.findUnique.mockResolvedValue(null);
    tx.cityCreationRequest.update.mockResolvedValue({
      id: 'request-1',
      status: CityCreationRequestStatus.APPROVED,
      reviewedById: 'admin-1',
      reviewedAt: new Date('2026-06-06T10:00:00.000Z'),
    });
    mockCityService.provisionApprovedCity.mockResolvedValue({
      id: 'city-1',
      name: 'Kyiv',
    });

    await expect(
      service.approveCityCreationRequest('request-1', 'admin-1'),
    ).resolves.toMatchObject({
      success: true,
      city: { id: 'city-1', name: 'Kyiv' },
    });

    expect(mockCityService.provisionApprovedCity).toHaveBeenCalledWith(tx, {
      requesterId: 'user-1',
      name: 'Kyiv',
      region: 'Kyiv Oblast',
      centerLat: 50.45,
      centerLng: 30.52,
      domain: 'kyiv.example.com',
      verificationAttachmentId: 'attachment-1',
    });
    expect(tx.cityCreationRequest.update).toHaveBeenCalledTimes(1);
    const [updateArgs] = tx.cityCreationRequest.update.mock.calls[0] as [
      CityCreationRequestUpdateArgs,
    ];

    expect(updateArgs.data.reviewedAt).toBeInstanceOf(Date);
    expect(updateArgs).toEqual({
      where: { id: 'request-1' },
      data: {
        status: CityCreationRequestStatus.APPROVED,
        reviewedById: 'admin-1',
        reviewedAt: updateArgs.data.reviewedAt,
        rejectionReason: null,
        cityId: 'city-1',
      },
      select: {
        id: true,
        cityId: true,
        status: true,
        reviewedAt: true,
        reviewedById: true,
      },
    });
  });

  it('rejects review changes for already reviewed requests', async () => {
    mockPrismaService.cityCreationRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: CityCreationRequestStatus.APPROVED,
    });

    await expect(
      service.rejectCityCreationRequest('request-1', 'admin-1', {
        rejectionReason: 'Missing official document',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.cityCreationRequest.update).not.toHaveBeenCalled();
  });

  it('rejects removing own system admin role', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      systemRole: SystemRole.ADMIN,
    });

    await expect(
      service.updateUserSystemRole('admin-1', 'admin-1', {
        systemRole: SystemRole.USER,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.user.count).not.toHaveBeenCalled();
    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  });

  it('rejects removing the last system admin role', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      systemRole: SystemRole.ADMIN,
    });
    mockPrismaService.user.count.mockResolvedValue(1);

    await expect(
      service.updateUserSystemRole('admin-1', 'admin-2', {
        systemRole: SystemRole.USER,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  });
});
