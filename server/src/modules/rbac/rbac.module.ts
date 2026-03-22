import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  providers: [RbacService],
  exports: [RbacService],
  imports: [PrismaModule],
})
export class RbacModule {}
