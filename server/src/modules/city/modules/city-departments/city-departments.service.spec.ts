import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CityDepartmentsService } from './city-departments.service';

describe('CityDepartmentsService', () => {
  let service: CityDepartmentsService;

  const mockPrismaService = {
    userCity: {
      findUnique: jest.fn(),
    },
    department: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityDepartmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CityDepartmentsService>(CityDepartmentsService);
    jest.clearAllMocks();
  });

  it('listDepartments should require city membership and return active departments', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-1',
    });
    mockPrismaService.department.findMany.mockResolvedValue([]);

    await service.listDepartments('city-1', 'user-1');

    expect(mockPrismaService.userCity.findUnique).toHaveBeenCalledWith({
      where: {
        userId_cityId: {
          userId: 'user-1',
          cityId: 'city-1',
        },
      },
      select: {
        userId: true,
        isBlocked: true,
      },
    });
    expect(mockPrismaService.department.findMany).toHaveBeenCalledWith({
      where: { cityId: 'city-1', isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  });

  it('createDepartment should create a custom city department', async () => {
    mockPrismaService.department.findFirst.mockResolvedValue(null);
    mockPrismaService.department.create.mockResolvedValue({
      id: 'dep-1',
      name: 'Parks',
      type: 'CUSTOM',
      description: null,
      isDefault: false,
    });

    await service.createDepartment('city-1', { name: 'Parks' });

    expect(mockPrismaService.department.create).toHaveBeenCalledWith({
      data: {
        cityId: 'city-1',
        name: 'Parks',
        type: 'CUSTOM',
        description: null,
        isDefault: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
    });
  });

  it('updateDepartment should reject default departments', async () => {
    mockPrismaService.department.findFirst.mockResolvedValue({
      id: 'dep-1',
      name: 'Roads',
      isDefault: true,
    });

    await expect(
      service.updateDepartment('city-1', 'dep-1', { name: 'New roads' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deactivateDepartment should soft-delete custom departments', async () => {
    mockPrismaService.department.findFirst.mockResolvedValue({
      id: 'dep-1',
      name: 'Parks',
      isDefault: false,
    });
    mockPrismaService.department.update.mockResolvedValue({
      id: 'dep-1',
      name: 'Parks',
      type: 'CUSTOM',
      description: null,
      isDefault: false,
    });

    await service.deactivateDepartment('city-1', 'dep-1');

    expect(mockPrismaService.department.update).toHaveBeenCalledWith({
      where: { id: 'dep-1' },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
    });
  });
});
