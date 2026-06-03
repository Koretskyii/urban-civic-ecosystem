import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';

import { PrismaService } from '@/prisma/prisma.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { R2StorageService } from '@/modules/r2/r2.service';

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: PrismaService, useValue: {} },
        { provide: RbacService, useValue: {} },
        { provide: R2StorageService, useValue: {} },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
