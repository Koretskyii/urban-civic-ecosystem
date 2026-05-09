import { Controller, Get, Param } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('city/:cityId/posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Get()
    async getCityPosts(@Param('cityId') cityId: string) {
        return this.postsService.getCityPosts(cityId);
    }
}
