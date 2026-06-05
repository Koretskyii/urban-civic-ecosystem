import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { CityDepartmentsController } from './city-departments.controller';
import { CityDepartmentsService } from './city-departments.service';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [CityDepartmentsController],
  providers: [CityDepartmentsService, PermissionsGuard],
})
export class CityDepartmentsModule {}
