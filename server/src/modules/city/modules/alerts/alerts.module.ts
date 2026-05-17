import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [AlertsController],
  providers: [AlertsService, PermissionsGuard],
})
export class AlertsModule {}
