import { Controller, Get, Param } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('city/:cityId/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}
  @Get()
  async getCityNews(@Param('cityId') cityId: string) {
    return this.newsService.getCityNews(cityId);
  }
}
