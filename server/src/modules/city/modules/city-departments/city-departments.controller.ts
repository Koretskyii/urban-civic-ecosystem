import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { RequirePermissions } from '@/modules/rbac/decorators/permissions.decorators';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import type { RequestWithUser } from '@/types/auth.types';
import { CityDepartmentsService } from './city-departments.service';
import { CreateCityDepartmentDto, UpdateCityDepartmentDto } from './dto';

@Controller('city/:cityId/departments')
@UseGuards(JWTGuard)
export class CityDepartmentsController {
  constructor(
    private readonly cityDepartmentsService: CityDepartmentsService,
  ) {}

  @Get()
  async getDepartments(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.cityDepartmentsService.listDepartments(cityId, req.user.id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.CITY_MANAGE)
  async createDepartment(
    @Param('cityId') cityId: string,
    @Body() dto: CreateCityDepartmentDto,
  ) {
    return this.cityDepartmentsService.createDepartment(cityId, dto);
  }

  @Patch(':departmentId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.CITY_MANAGE)
  async updateDepartment(
    @Param('cityId') cityId: string,
    @Param('departmentId') departmentId: string,
    @Body() dto: UpdateCityDepartmentDto,
  ) {
    return this.cityDepartmentsService.updateDepartment(
      cityId,
      departmentId,
      dto,
    );
  }

  @Delete(':departmentId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.CITY_MANAGE)
  async deleteDepartment(
    @Param('cityId') cityId: string,
    @Param('departmentId') departmentId: string,
  ) {
    return this.cityDepartmentsService.deactivateDepartment(
      cityId,
      departmentId,
    );
  }
}
