import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { RequirePermissions } from '@/modules/rbac/decorators/permissions.decorators';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import type { RequestWithUser } from '@/types/auth.types';
import { CreateNewsDto, GetNewsQueryDto, UpdateNewsDto } from './dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('city/:cityId/news')
@UseGuards(JWTGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.NEWS_CREATE)
  @UseInterceptors(AnyFilesInterceptor())
  async createNews(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateNewsDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.newsService.createCityNews(cityId, req.user.id, dto, files);
  }

  @Get()
  async getCityNews(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: GetNewsQueryDto,
  ) {
    return this.newsService.getCityNews(cityId, req.user.id, query);
  }

  @Get(':newsId')
  getCityNewsById(
    @Param('cityId') cityId: string,
    @Param('newsId') newsId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.newsService.getCityNewsById(cityId, newsId, req.user.id);
  }

  @Patch(':newsId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.NEWS_UPDATE)
  updateNews(
    @Param('cityId') cityId: string,
    @Param('newsId') newsId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.updateCityNews(cityId, newsId, req.user.id, dto);
  }

  @Delete(':newsId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.NEWS_DELETE)
  softDeleteNews(
    @Param('cityId') cityId: string,
    @Param('newsId') newsId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.newsService.softDeleteCityNews(cityId, newsId, req.user.id);
  }
}
