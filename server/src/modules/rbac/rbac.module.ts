import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
    providers: [RbacService],
    exports: [RbacService],
    imports: [PrismaModule],
})
export class RbacModule { }
