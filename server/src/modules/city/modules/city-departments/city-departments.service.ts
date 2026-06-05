import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CITY_DEPARTMENTS_ERRORS } from './city-departments.constants';
import { CreateCityDepartmentDto, UpdateCityDepartmentDto } from './dto';

const CUSTOM_DEPARTMENT_TYPE = 'CUSTOM';

@Injectable()
export class CityDepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDepartments(cityId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    return this.prisma.department.findMany({
      where: { cityId, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createDepartment(cityId: string, dto: CreateCityDepartmentDto) {
    await this.ensureNameAvailable(cityId, dto.name);

    return this.prisma.department.create({
      data: {
        cityId,
        name: dto.name,
        type: CUSTOM_DEPARTMENT_TYPE,
        description: dto.description || null,
        isDefault: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
    });
  }

  async updateDepartment(
    cityId: string,
    departmentId: string,
    dto: UpdateCityDepartmentDto,
  ) {
    const department = await this.getDepartmentForMutation(
      cityId,
      departmentId,
    );

    if (dto.name && dto.name !== department.name) {
      await this.ensureNameAvailable(cityId, dto.name, departmentId);
    }

    return this.prisma.department.update({
      where: { id: departmentId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description || null }
          : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
    });
  }

  async deactivateDepartment(cityId: string, departmentId: string) {
    await this.getDepartmentForMutation(cityId, departmentId);

    return this.prisma.department.update({
      where: { id: departmentId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        isDefault: true,
      },
    });
  }

  private async getDepartmentForMutation(cityId: string, departmentId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, cityId, isActive: true },
      select: {
        id: true,
        name: true,
        isDefault: true,
      },
    });

    if (!department) {
      throw new NotFoundException(CITY_DEPARTMENTS_ERRORS.DEPARTMENT_NOT_FOUND);
    }

    if (department.isDefault) {
      throw new BadRequestException(
        CITY_DEPARTMENTS_ERRORS.DEFAULT_DEPARTMENT_IMMUTABLE,
      );
    }

    return department;
  }

  private async ensureNameAvailable(
    cityId: string,
    name: string,
    excludeDepartmentId?: string,
  ) {
    const existing = await this.prisma.department.findFirst({
      where: {
        cityId,
        name,
        ...(excludeDepartmentId ? { id: { not: excludeDepartmentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        CITY_DEPARTMENTS_ERRORS.DUPLICATE_DEPARTMENT_NAME,
      );
    }
  }

  private async ensureCityMembership(cityId: string, userId: string) {
    const membership = await this.prisma.userCity.findUnique({
      where: {
        userId_cityId: {
          userId,
          cityId,
        },
      },
      select: {
        userId: true,
        isBlocked: true,
      },
    });

    if (!membership || membership.isBlocked) {
      throw new ForbiddenException('User is not a member of this city');
    }
  }
}
