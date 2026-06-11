import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { SurveysSweepWorker } from './surveys-sweep.worker';
import { PrismaModule } from '@/prisma/prisma.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [SurveysController],
  providers: [SurveysService, SurveysSweepWorker, PermissionsGuard],
  exports: [SurveysService],
})
export class SurveysModule {}
