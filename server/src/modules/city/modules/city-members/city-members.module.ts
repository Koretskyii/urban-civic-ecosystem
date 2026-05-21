import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { CityMembersController } from './city-members.controller';
import { CityMembersService } from './city-members.service';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [CityMembersController],
  providers: [CityMembersService, PermissionsGuard],
})
export class CityMembersModule {}
