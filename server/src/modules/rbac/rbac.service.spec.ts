import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('RbacService', () => {
  let service: RbacService;

  const mockPrismaService = {
    permission: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
