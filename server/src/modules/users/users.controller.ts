import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { RbacService } from '@/modules/rbac/rbac.service';
import type { Request } from 'express';
import type { User } from '@/types/auth.types';
import { ERROR_MESSAGES } from '@/modules/auth/constants/errors.const';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

type PermissionsResponse = {
  permissions: string[];
};

@ApiTags('Users')
@ApiBearerAuth('access_token')
@Controller('users')
@UseGuards(JWTGuard)
export class UsersController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('me/permissions')
  @ApiOperation({
    summary: 'Get current user permissions in a specific city',
  })
  @ApiQuery({
    name: 'cityId',
    required: true,
    type: String,
    description: 'City ID for which to resolve user permissions',
  })
  @ApiOkResponse({
    description: 'List of permission keys for current user in the city',
    schema: {
      type: 'object',
      properties: {
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['news:create', 'news:update', 'news:manage'],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid access token' })
  async getMyPermissions(
    @Req() req: Request,
    @Query('cityId') cityId?: string,
  ): Promise<PermissionsResponse> {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!cityId || typeof cityId !== 'string') {
      throw new BadRequestException(ERROR_MESSAGES.CITY_ID_MISSING);
    }

    const permissions = await this.rbacService.getUserPermissions(
      user.id,
      cityId,
    );
    return { permissions };
  }
}
