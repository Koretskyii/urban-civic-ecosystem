import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { RequirePermissions } from '@/modules/rbac/decorators/permissions.decorators';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import type { RequestWithUser } from '@/types/auth.types';
import { CityMembersService } from './city-members.service';
import { UpdateCityMemberRoleDto } from './dto';

@Controller('city/:cityId/members')
@UseGuards(JWTGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class CityMembersController {
  constructor(private readonly cityMembersService: CityMembersService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ROLE_MANAGE)
  async getMembers(@Param('cityId') cityId: string) {
    return this.cityMembersService.listMembers(cityId);
  }

  @Patch(':userId/role')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ROLE_MANAGE)
  async updateRole(
    @Param('cityId') cityId: string,
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCityMemberRoleDto,
  ) {
    return this.cityMembersService.updateMemberRole(
      cityId,
      userId,
      req.user.id,
      dto,
    );
  }
}
