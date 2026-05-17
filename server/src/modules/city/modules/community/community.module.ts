import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [CommunityController],
  providers: [CommunityService, PermissionsGuard],
})
export class CommunityModule {}
