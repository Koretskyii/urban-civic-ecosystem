import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { RbacService } from '@/modules/rbac/rbac.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: RbacService, useValue: { getUserPermissions: jest.fn() } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
