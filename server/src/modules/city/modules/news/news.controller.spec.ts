import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './news.controller';

import { NewsService } from './news.service';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';

describe('NewsController', () => {
  let controller: NewsController;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [NewsController],
      providers: [{ provide: NewsService, useValue: {} }],
    })
      .overrideGuard(JWTGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<NewsController>(NewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
