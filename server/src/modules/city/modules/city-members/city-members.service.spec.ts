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
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
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

    const result = await service.listMembers('city-1');

    expect(result).toEqual([
      {
        userId: 'user-1',
        joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        name: 'User One',
        email: 'u1@test.local',
        role: ROLES.MUNICIPALITY,
      },
    ]);
  });

  it('updateMemberRole should replace city roles with one selected role', async () => {
    mockPrismaService.userCity.findUnique.mockResolvedValue({
      userId: 'user-2',
    });
    mockPrismaService.role.findMany.mockResolvedValue([
      { id: 'role-admin', name: ROLES.ADMIN },
      { id: 'role-citizen', name: ROLES.CITIZEN },
      { id: 'role-organizer', name: ROLES.ORGANIZER },
      { id: 'role-municipality', name: ROLES.MUNICIPALITY },
    ]);
    mockPrismaService.role.findUnique.mockResolvedValue({
      id: 'role-organizer',
      name: ROLES.ORGANIZER,
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
      { role: ROLES.ORGANIZER },
    );

    expect(mockPrismaService.userRole.deleteMany).toHaveBeenCalled();
    expect(mockPrismaService.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        roleId: 'role-organizer',
      },
    });
    expect(result).toEqual({ userId: 'user-2', role: ROLES.ORGANIZER });
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
});
