import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import { CreateAlertDto, GetAlertsQueryDto, UpdateAlertDto } from './dto';

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async createCityAlert(cityId: string, userId: string, dto: CreateAlertDto) {
    await this.ensureCityMembership(cityId, userId);
    await this.ensureAlertTypeExists(dto.alertTypeId);

    return this.prisma.alert.create({
      data: {
        cityId,
        publisherId: userId,
        alertTypeId: dto.alertTypeId,
        title: dto.title.trim(),
        content: dto.content.trim(),
      },
      select: this.alertSelect(),
    });
  }

  async getCityAlerts(cityId: string, userId: string, query: GetAlertsQueryDto) {
    await this.ensureCityMembership(cityId, userId);

    const canManageAlerts = await this.canManageAlerts(cityId, userId);
    const includeDeleted = query.includeDeleted === true;

    if (includeDeleted && !canManageAlerts) {
      throw new ForbiddenException('You cannot request deleted alerts');
    }

    const trimmedSearch = query.search?.trim();

    return this.prisma.alert.findMany({
      where: {
        cityId,
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(trimmedSearch
          ? {
              OR: [
                {
                  title: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  content: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      select: this.alertSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAlertTypes(cityId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    return this.prisma.alertType.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCityAlertById(cityId: string, alertId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);
    const canManageAlerts = await this.canManageAlerts(cityId, userId);

    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        cityId,
        ...(canManageAlerts ? {} : { deletedAt: null }),
      },
      select: this.alertSelect(),
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  async updateCityAlert(
    cityId: string,
    alertId: string,
    userId: string,
    dto: UpdateAlertDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        cityId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Alert not found');
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Cannot edit deleted alert');
    }

    if (dto.alertTypeId) {
      await this.ensureAlertTypeExists(dto.alertTypeId);
    }

    const updateData: {
      alertTypeId?: string;
      title?: string;
      content?: string;
    } = {};

    if (typeof dto.alertTypeId === 'string') {
      updateData.alertTypeId = dto.alertTypeId;
    }
    if (typeof dto.title === 'string') {
      updateData.title = dto.title.trim();
    }
    if (typeof dto.content === 'string') {
      updateData.content = dto.content.trim();
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: updateData,
      select: this.alertSelect(),
    });
  }

  async softDeleteCityAlert(cityId: string, alertId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        cityId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Alert not found');
    }

    if (existing.deletedAt) {
      return {
        success: true,
        deleted: false,
        message: 'Alert already deleted',
      };
    }

    await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      deleted: true,
    };
  }

  private alertSelect() {
    return {
      id: true,
      cityId: true,
      publisherId: true,
      alertTypeId: true,
      title: true,
      content: true,
      timestamp: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      alertType: {
        select: {
          id: true,
          name: true,
        },
      },
    } as const;
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
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this city');
    }
  }

  private async canManageAlerts(cityId: string, userId: string) {
    return this.rbacService.hasPermission(
      userId,
      cityId,
      PERMISSIONS_KEYS.ALERT_MANAGE,
    );
  }

  private async ensureAlertTypeExists(alertTypeId: string) {
    const type = await this.prisma.alertType.findUnique({
      where: { id: alertTypeId },
      select: { id: true },
    });

    if (!type) {
      throw new BadRequestException('Alert type not found');
    }
  }
}
