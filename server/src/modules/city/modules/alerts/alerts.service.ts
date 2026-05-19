import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCityAlerts(cityId: string) {
    const alerts = await this.prisma.alert.findMany({
      where: {
        cityId: cityId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        alertType: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return alerts;
  }
}
