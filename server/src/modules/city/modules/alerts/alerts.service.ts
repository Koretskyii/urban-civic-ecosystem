import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AlertsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async getCityAlerts(cityId: string) {
        console.log(cityId, "cityId");
        const alerts = await this.prisma.alert.findMany({
            where: {
                cityId: cityId,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(alerts);
        return alerts;
    }
}
