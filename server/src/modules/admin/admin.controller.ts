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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import type { RequestWithUser } from '@/types/auth.types';
import { SystemAdminGuard } from './guards/system-admin.guard';
import { AdminService } from './admin.service';
import {
  GetAdminCitiesQueryDto,
  GetAdminUsersQueryDto,
  GetCityCreationRequestsQueryDto,
  RejectCityCreationRequestDto,
  UpdateAdminCityDto,
  UpdateUserSystemRoleDto,
} from './dto';

@Controller('admin')
@UseGuards(JWTGuard, SystemAdminGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('city-creation-requests')
  listCityCreationRequests(@Query() query: GetCityCreationRequestsQueryDto) {
    return this.adminService.listCityCreationRequests(query);
  }

  @Get('city-creation-requests/:id')
  getCityCreationRequest(@Param('id') id: string) {
    return this.adminService.getCityCreationRequest(id);
  }

  @Post('city-creation-requests/:id/approve')
  approveCityCreationRequest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.approveCityCreationRequest(id, req.user.id);
  }

  @Post('city-creation-requests/:id/reject')
  rejectCityCreationRequest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: RejectCityCreationRequestDto,
  ) {
    return this.adminService.rejectCityCreationRequest(id, req.user.id, dto);
  }

  @Get('cities')
  listCities(@Query() query: GetAdminCitiesQueryDto) {
    return this.adminService.listCities(query);
  }

  @Patch('cities/:id')
  updateCity(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateAdminCityDto,
  ) {
    return this.adminService.updateCity(id, req.user.id, dto);
  }

  @Delete('cities/:id')
  softDeleteCity(@Param('id') id: string) {
    return this.adminService.softDeleteCity(id);
  }

  @Get('users')
  listUsers(@Query() query: GetAdminUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/system-role')
  updateUserSystemRole(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserSystemRoleDto,
  ) {
    return this.adminService.updateUserSystemRole(id, req.user.id, dto);
  }
}
