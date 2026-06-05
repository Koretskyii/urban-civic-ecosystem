import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
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
import { GetCityMembersQueryDto, UpdateCityMemberRoleDto } from './dto';

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
  async getMembers(
    @Param('cityId') cityId: string,
    @Query() query: GetCityMembersQueryDto,
  ) {
    return this.cityMembersService.listMembers(cityId, query);
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

  @Patch(':userId/block')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ROLE_MANAGE)
  async blockMember(
    @Param('cityId') cityId: string,
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.cityMembersService.updateMemberBlockStatus(
      cityId,
      userId,
      req.user.id,
      true,
    );
  }

  @Patch(':userId/unblock')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.ROLE_MANAGE)
  async unblockMember(
    @Param('cityId') cityId: string,
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.cityMembersService.updateMemberBlockStatus(
      cityId,
      userId,
      req.user.id,
      false,
    );
  }
}
