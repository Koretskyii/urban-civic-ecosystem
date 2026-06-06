import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { SystemAdminGuard } from './guards/system-admin.guard';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CityModule } from '@/modules/city/city.module';

@Module({
  imports: [PrismaModule, CityModule],
  controllers: [AdminController],
  providers: [SystemAdminGuard, AdminService],
  exports: [SystemAdminGuard],
})
export class AdminModule {}
