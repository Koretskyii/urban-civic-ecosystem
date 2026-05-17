import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';

@Controller('city/:cityId/news')
@UseGuards(JWTGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}
  @Get()
  async getCityNews(@Param('cityId') cityId: string) {
    return this.newsService.getCityNews(cityId);
  }
}
