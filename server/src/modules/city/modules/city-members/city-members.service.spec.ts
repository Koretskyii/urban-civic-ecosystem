import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLES } from '@/modules/rbac/constants/roles.const';
import { CityMembersService } from './city-members.service';

describe('CityMembersService', () => {
  let service: CityMembersService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    userCity: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityMembersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CityMembersService>(CityMembersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('listMembers should return members with resolved primary role', async () => {
    mockPrismaService.userCity.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        isBlocked: false,
        blockedAt: null,
        blockedById: null,
        user: {
          name: 'User One',
          email: 'u1@test.local',
          userRoles: [
            { role: { name: ROLES.CITIZEN } },
            { role: { name: ROLES.MUNICIPALITY } },
          ],
        },
      },
    ]);
    mockPrismaService.userCity.count.mockResolvedValue(1);

    const result = await service.listMembers('city-1');

    expect(result).toEqual({
      items: [
        {
          userId: 'user-1',
          joinedAt: new Date('2026-01-01T00:00:00.000Z'),
          name: 'User One',
          email: 'u1@test.local',
          role: ROLES.MUNICIPALITY,
          isBlocked: false,
          blockedAt: null,
          blockedById: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      nextPage: null,
    });
  });

  it('listMembers should apply pagination, search, role and sorting filters', async () => {
    mockPrismaService.userCity.findMany.mockResolvedValue([]);
    mockPrismaService.userCity.count.mockResolvedValue(0);

    await service.listMembers('city-1', {
      search: 'alex',
      role: ROLES.ADMIN,
      limit: 25,
      page: 2,
      sortBy: 'email',
      sortOrder: 'desc',
    });

    const findManyCalls = mockPrismaService.userCity.findMany.mock
      .calls as unknown[][];
    const findManyCall = findManyCalls[0]?.[0] as {
      where: {
        cityId: string;
        user: {
          OR: unknown[];
          userRoles: { some: { role: { cityId: string; name: string } } };
        };
      };
      orderBy: { user: { email: string } };
      skip: number;
      take: number;
    };
    expect(findManyCall.where.cityId).toBe('city-1');
    expect(findManyCall.where.user.OR).toEqual([
      { name: { contains: 'alex', mode: 'insensitive' } },
      { email: { contains: 'alex', mode: 'insensitive' } },
    ]);
    expect(findManyCall.where.user.userRoles.some.role).toEqual({
      cityId: 'city-1',
      name: ROLES.ADMIN,
    });
    expect(findManyCall.orderBy).toEqual({ user: { email: 'desc' } });
    expect(findManyCall.skip).toBe(25);
    expect(findManyCall.take).toBe(25);

    const countCalls = mockPrismaService.userCity.count.mock
      .calls as unknown[][];
    const countCall = countCalls[0]?.[0] as {
      where: { cityId: string };
    };
    expect(countCall.where.cityId).toBe('city-1');
  });

  it('updateMemberRole should replace city roles with one selected role', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-2',
    });
    mockPrismaService.role.findMany.mockResolvedValue([
      { id: 'role-admin', name: ROLES.ADMIN },
      { id: 'role-citizen', name: ROLES.CITIZEN },
      { id: 'role-municipality', name: ROLES.MUNICIPALITY },
    ]);
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-municipality',
      name: ROLES.MUNICIPALITY,
    });
    mockPrismaService.userRole.findMany.mockResolvedValue([
      { roleId: 'role-citizen' },
    ]);

    mockPrismaService.$transaction.mockImplementation(
      async (cb: (tx: any) => Promise<unknown>) =>
        cb({
          userRole: {
            deleteMany: mockPrismaService.userRole.deleteMany,
            create: mockPrismaService.userRole.create,
          },
        }),
    );

    const result = await service.updateMemberRole(
      'city-1',
      'user-2',
      'admin-1',
      { role: ROLES.MUNICIPALITY },
    );

    expect(mockPrismaService.userRole.deleteMany).toHaveBeenCalled();
    expect(mockPrismaService.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        roleId: 'role-municipality',
      },
    });
    expect(result).toEqual({ userId: 'user-2', role: ROLES.MUNICIPALITY });
  });

  it('updateMemberRole should reject role change for last admin', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-1',
    });
    mockPrismaService.role.findMany.mockResolvedValue([
      { id: 'role-admin', name: ROLES.ADMIN },
      { id: 'role-citizen', name: ROLES.CITIZEN },
    ]);
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-citizen',
      name: ROLES.CITIZEN,
    });
    mockPrismaService.userRole.findMany
      .mockResolvedValueOnce([{ roleId: 'role-admin' }])
      .mockResolvedValueOnce([{ userId: 'user-1' }]);

    await expect(
      service.updateMemberRole('city-1', 'user-1', 'admin-2', {
        role: ROLES.CITIZEN,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateMemberRole should reject self-demotion for last admin', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'admin-1',
    });
    mockPrismaService.role.findMany.mockResolvedValue([
      { id: 'role-admin', name: ROLES.ADMIN },
      { id: 'role-citizen', name: ROLES.CITIZEN },
    ]);
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-citizen',
      name: ROLES.CITIZEN,
    });
    mockPrismaService.userRole.findMany
      .mockResolvedValueOnce([{ roleId: 'role-admin' }])
      .mockResolvedValueOnce([{ userId: 'admin-1' }]);

    await expect(
      service.updateMemberRole('city-1', 'admin-1', 'admin-1', {
        role: ROLES.CITIZEN,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateMemberRole should be no-op when member already has the same single role', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-2',
    });
    mockPrismaService.role.findMany.mockResolvedValue([
      { id: 'role-admin', name: ROLES.ADMIN },
      { id: 'role-citizen', name: ROLES.CITIZEN },
    ]);
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-citizen',
      name: ROLES.CITIZEN,
    });
    mockPrismaService.userRole.findMany.mockResolvedValue([
      { roleId: 'role-citizen' },
    ]);

    const result = await service.updateMemberRole(
      'city-1',
      'user-2',
      'admin-1',
      {
        role: ROLES.CITIZEN,
      },
    );

    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    expect(result).toEqual({ userId: 'user-2', role: ROLES.CITIZEN });
  });

  it('updateMemberRole should throw if city member not found', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMemberRole('city-1', 'missing-user', 'admin-1', {
        role: ROLES.CITIZEN,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateMemberBlockStatus should block a non-admin member', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-2',
      isBlocked: false,
    });
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-admin',
    });
    mockPrismaService.userRole.findUnique.mockResolvedValue(null);
    mockPrismaService.userCity.update.mockResolvedValue({
      userId: 'user-2',
      isBlocked: true,
      blockedAt: new Date('2026-06-05T00:00:00.000Z'),
      blockedById: 'admin-1',
    });

    const result = await service.updateMemberBlockStatus(
      'city-1',
      'user-2',
      'admin-1',
      true,
    );

    const updateCalls = mockPrismaService.userCity.update.mock
      .calls as unknown[][];
    const updateCall = updateCalls[0]?.[0] as {
      where: { userId_cityId: { userId: string; cityId: string } };
      data: {
        isBlocked: boolean;
        blockedAt: Date | null;
        blockedById: string | null;
      };
      select: Record<string, boolean>;
    };
    expect(updateCall.where.userId_cityId).toEqual({
      userId: 'user-2',
      cityId: 'city-1',
    });
    expect(updateCall.data.isBlocked).toBe(true);
    expect(updateCall.data.blockedAt).toBeInstanceOf(Date);
    expect(updateCall.data.blockedById).toBe('admin-1');
    expect(updateCall.select).toEqual({
      userId: true,
      isBlocked: true,
      blockedAt: true,
      blockedById: true,
    });
    expect(result.isBlocked).toBe(true);
  });

  it('updateMemberBlockStatus should reject self-block', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'admin-1',
      isBlocked: false,
    });

    await expect(
      service.updateMemberBlockStatus('city-1', 'admin-1', 'admin-1', true),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateMemberBlockStatus should reject blocking admins', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'admin-2',
      isBlocked: false,
    });
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-admin',
    });
    mockPrismaService.userRole.findUnique.mockResolvedValue({
      userId: 'admin-2',
    });

    await expect(
      service.updateMemberBlockStatus('city-1', 'admin-2', 'admin-1', true),
    ).rejects.toThrow(BadRequestException);
  });
});
