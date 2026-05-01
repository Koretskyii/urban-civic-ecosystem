import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { R2Module } from '../r2/r2.module';

@Module({
  imports: [PrismaModule, R2Module],
  controllers: [CityController],
  providers: [CityService],
})
export class CityModule {}
