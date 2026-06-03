import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { R2Module } from '@/modules/r2/r2.module';

@Module({
  imports: [PrismaModule, RbacModule, R2Module],
  controllers: [NewsController],
  providers: [NewsService, PermissionsGuard],
})
export class NewsModule {}
