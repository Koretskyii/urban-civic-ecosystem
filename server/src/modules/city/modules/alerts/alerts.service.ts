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
import type { Prisma } from '@/generated/prisma/client';
import { buildAlertEventPayload } from '@/modules/notifications/domain/domain-event.factory';
import { DOMAIN_EVENT_TYPES } from '@/modules/notifications/domain/domain-events';

const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async createCityAlert(cityId: string, userId: string, dto: CreateAlertDto) {
    await this.ensureCityMembership(cityId, userId);
    await this.ensureAlertTypeExists(dto.alertTypeId);

    return this.prisma.$transaction(async (tx) => {
      const alert = await tx.alert.create({
        data: {
          cityId,
          publisherId: userId,
          alertTypeId: dto.alertTypeId,
          severity: dto.severity,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          title: dto.title.trim(),
          content: dto.content.trim(),
        },
        select: this.alertSelect(),
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'alert',
          aggregateId: alert.id,
          eventType: DOMAIN_EVENT_TYPES.ALERT_CREATED,
          payload: buildAlertEventPayload({
            cityId,
            alertId: alert.id,
            publisherId: userId,
            title: alert.title,
            alertTypeId: alert.alertTypeId,
            severity: alert.severity,
            expiresAt: alert.expiresAt,
          }),
        },
      });

      return alert;
    });
  }

  async getCityAlerts(
    cityId: string,
    userId: string,
    query: GetAlertsQueryDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const canManageAlerts = await this.canManageAlerts(cityId, userId);
    const includeDeleted = query.includeDeleted === true;
    const onlyActive = query.onlyActive !== false;
    const now = new Date();
    const take = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const sortBy = query.sortBy ?? 'severity';
    const sortOrder = query.sortOrder ?? 'asc';
    const orderBy: Prisma.AlertOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      ...(sortBy === 'createdAt'
        ? []
        : ([
            { createdAt: 'desc' },
          ] satisfies Prisma.AlertOrderByWithRelationInput[])),
      { id: sortOrder },
    ];

    if (includeDeleted && !canManageAlerts) {
      throw new ForbiddenException('You cannot request deleted alerts');
    }

    const trimmedSearch = query.search?.trim();
    const andConditions: Prisma.AlertWhereInput[] = [];

    if (onlyActive) {
      andConditions.push({
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      });
    }

    if (trimmedSearch) {
      andConditions.push({
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
      });
    }

    const alerts = await this.prisma.alert.findMany({
      where: {
        cityId,
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(query.severity ? { severity: query.severity } : {}),
        ...(query.alertTypeId ? { alertTypeId: query.alertTypeId } : {}),
        ...(andConditions.length > 0 ? { AND: andConditions } : {}),
      },
      select: this.alertSelect(),
      orderBy,
      take: take + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    });

    const hasNextPage = alerts.length > take;
    const items = hasNextPage ? alerts.slice(0, take) : alerts;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
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
    const now = new Date();

    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        cityId,
        ...(canManageAlerts
          ? {}
          : {
              deletedAt: null,
              OR: [
                { expiresAt: null },
                {
                  expiresAt: {
                    gt: now,
                  },
                },
              ],
            }),
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
      severity?: UpdateAlertDto['severity'];
      expiresAt?: Date | null;
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
    if (dto.severity !== undefined) {
      updateData.severity = dto.severity;
    }
    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.alert.update({
        where: { id: alertId },
        data: updateData,
        select: this.alertSelect(),
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'alert',
          aggregateId: updated.id,
          eventType: DOMAIN_EVENT_TYPES.ALERT_UPDATED,
          payload: buildAlertEventPayload({
            cityId,
            alertId: updated.id,
            publisherId: updated.publisherId,
            title: updated.title,
            alertTypeId: updated.alertTypeId,
            severity: updated.severity,
            expiresAt: updated.expiresAt,
          }),
        },
      });

      return updated;
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

    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.alert.update({
        where: { id: alertId },
        data: {
          deletedAt: new Date(),
        },
        select: this.alertSelect(),
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'alert',
          aggregateId: deleted.id,
          eventType: DOMAIN_EVENT_TYPES.ALERT_DELETED,
          payload: buildAlertEventPayload({
            cityId,
            alertId: deleted.id,
            publisherId: deleted.publisherId,
            title: deleted.title,
            alertTypeId: deleted.alertTypeId,
            severity: deleted.severity,
            expiresAt: deleted.expiresAt,
          }),
        },
      });
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
      severity: true,
      expiresAt: true,
      title: true,
      content: true,
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
        isBlocked: true,
      },
    });

    if (!membership || membership.isBlocked) {
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
