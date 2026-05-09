import { Controller, Get, Param } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('city/:cityId/community')
export class CommunityController {
    constructor(private readonly communityService: CommunityService) { }

    @Get()
    async getCityCommunity(@Param('cityId') cityId: string) {
        return this.communityService.getCityCommunity(cityId);
    }
}
