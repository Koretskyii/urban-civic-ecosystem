import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { R2Module } from '../r2/r2.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NewsModule } from './modules/news/news.module';
import { CityRequestsModule } from './modules/city-requests/city-requests.module';
import { CityMembersModule } from './modules/city-members/city-members.module';
import { CityDepartmentsModule } from './modules/city-departments/city-departments.module';

@Module({
  imports: [
    PrismaModule,
    R2Module,
    AlertsModule,
    NewsModule,
    CityRequestsModule,
    CityMembersModule,
    CityDepartmentsModule,
  ],
  controllers: [CityController],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
