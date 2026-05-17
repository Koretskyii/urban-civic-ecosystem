import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [PostsController],
  providers: [PostsService, PermissionsGuard],
})
export class PostsModule {}
