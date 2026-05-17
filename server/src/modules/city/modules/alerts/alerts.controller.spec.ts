import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';

import { AlertsService } from './alerts.service';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';

describe('AlertsController', () => {
  let controller: AlertsController;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: {} }],
    })
      .overrideGuard(JWTGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<AlertsController>(AlertsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
