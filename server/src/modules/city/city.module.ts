import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { R2Module } from '../r2/r2.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NewsModule } from './modules/news/news.module';
import { PostsModule } from './modules/posts/posts.module';

@Module({
  imports: [PrismaModule, R2Module, AlertsModule, NewsModule, PostsModule],
  controllers: [CityController],
  providers: [CityService],
})
export class CityModule { }
