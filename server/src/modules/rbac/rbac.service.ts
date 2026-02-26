import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RbacService {
    constructor(private readonly prisma: PrismaService) { }

    async hasPermission(userId: string, cityId: string, permissionId: string): Promise<boolean> {
        const permission = await this.prisma.permission.findFirst({
            where: {
                id: permissionId,
                roles: {
                    some: {
                        role: {
                            city: {
                                id: cityId
                            },
                            users: {
                                some: {
                                    userId
                                }
                            }
                        }
                    }
                }
            }
        })

        return permission != null;
    }
}
