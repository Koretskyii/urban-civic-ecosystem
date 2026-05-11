import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';

import { PrismaService } from '@/prisma/prisma.service';

describe('AlertsService', () => {
  let provider: AlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsService, { provide: PrismaService, useValue: {} }],
    }).compile();

    provider = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
