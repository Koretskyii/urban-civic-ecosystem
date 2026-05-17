import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [NewsController],
  providers: [NewsService, PermissionsGuard],
})
export class NewsModule {}
