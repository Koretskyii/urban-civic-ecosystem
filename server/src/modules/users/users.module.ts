import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [UsersController],
})
export class UsersModule {}
