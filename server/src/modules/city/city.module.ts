import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { DomainVerificationService } from './domain-verification/domain-verification.service';
import { CityCreationService } from './city-creation/city-creation.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { R2Module } from '../r2/r2.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NewsModule } from './modules/news/news.module';
import { CityRequestsModule } from './modules/city-requests/city-requests.module';
import { CityMembersModule } from './modules/city-members/city-members.module';
import { CityDepartmentsModule } from './modules/city-departments/city-departments.module';
import { SurveysModule } from './modules/surveys/surveys.module';

@Module({
  imports: [
    PrismaModule,
    R2Module,
    AlertsModule,
    NewsModule,
    CityRequestsModule,
    CityMembersModule,
    CityDepartmentsModule,
    SurveysModule,
  ],
  controllers: [CityController],
  providers: [CityService, DomainVerificationService, CityCreationService],
  exports: [CityService, CityCreationService],
})
export class CityModule {}
