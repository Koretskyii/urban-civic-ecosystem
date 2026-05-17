import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';

@Controller('city/:cityId/community')
@UseGuards(JWTGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  async getCityCommunity(@Param('cityId') cityId: string) {
    return this.communityService.getCityCommunity(cityId);
  }
}
