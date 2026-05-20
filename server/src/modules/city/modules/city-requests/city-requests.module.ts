import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { R2Module } from '@/modules/r2/r2.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { CityRequestsController } from './city-requests.controller';
import { CityRequestsService } from './city-requests.service';

@Module({
  imports: [PrismaModule, RbacModule, R2Module],
  controllers: [CityRequestsController],
  providers: [CityRequestsService, PermissionsGuard],
})
export class CityRequestsModule {}
