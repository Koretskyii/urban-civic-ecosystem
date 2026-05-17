import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';

@Controller('city/:cityId/posts')
@UseGuards(JWTGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getCityPosts(@Param('cityId') cityId: string) {
    return this.postsService.getCityPosts(cityId);
  }
}
