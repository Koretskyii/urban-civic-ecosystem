import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { R2StorageService } from '@/modules/r2/r2.service';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import { ReportType, RequestStatus } from '@/generated/prisma/enums';
import {
  AssignCityRequestDto,
  CityRequestScope,
  CreateCityRequestDto,
  CreateMessageDto,
  CreateReportDto,
  GetCityRequestsQueryDto,
  UpdateCityRequestStatusDto,
} from './dto';
import {
  CITY_REQUESTS_CONSTANTS,
  CITY_REQUESTS_ERRORS,
} from './city-requests.constants';

@Injectable()
export class CityRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  async createRequest(
    cityId: string,
    userId: string,
    dto: CreateCityRequestDto,
    files?: Express.Multer.File[],
  ) {
    await this.ensureCityMembership(cityId, userId);

    return this.prisma.$transaction(async (tx) => {
      const cityRequest = await tx.cityRequest.create({
        data: {
          cityId,
          userId,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          priority: dto.priority ?? 0,
          location: dto.location,
          locationLat: dto.locationLat,
          locationLng: dto.locationLng,
          address: dto.address,
        },
      });

      await tx.chat.create({
        data: {
          cityId,
          cityRequestId: cityRequest.id,
          contextType: CITY_REQUESTS_CONSTANTS.CONTEXT_TYPE,
        },
      });

      if (files?.length) {
        const attachments = await this.uploadRequestAttachments(
          cityId,
          cityRequest.id,
          files,
        );

        await tx.attachment.createMany({
          data: attachments.map((attachment) => ({
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            url: attachment.url,
            type: CITY_REQUESTS_CONSTANTS.ATTACHMENT_TYPES.REQUEST,
            entityId: cityRequest.id,
            entityType: CITY_REQUESTS_CONSTANTS.ENTITY_TYPES.CITY_REQUEST,
            cityRequestId: cityRequest.id,
          })),
        });
      }

      return tx.cityRequest.findUnique({
        where: { id: cityRequest.id },
        include: {
          attachments: true,
          chat: true,
          assignedDepartment: true,
        },
      });
    });
  }

  async listRequests(
    cityId: string,
    userId: string,
    query: GetCityRequestsQueryDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const where = {
      cityId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId
        ? { assignedDepartmentId: query.departmentId }
        : {}),
      ...(query.scope === CityRequestScope.MINE ? { userId } : {}),
    };

    return this.prisma.cityRequest.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        address: true,
        locationLat: true,
        locationLng: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
        assignedDepartment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestDetail(cityId: string, requestId: string, userId: string) {
    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId, cityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
        assignedDepartment: true,
        reports: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            attachments: true,
          },
        },
        chat: {
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
              include: {
                author: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.REQUEST_NOT_FOUND);
    }

    await this.ensureCanAccessRequest(cityId, userId, request.userId);

    return request;
  }

  async assignDepartment(
    cityId: string,
    requestId: string,
    userId: string,
    dto: AssignCityRequestDto,
  ) {
    await this.ensureManagePermission(cityId, userId);

    const [request, department] = await Promise.all([
      this.prisma.cityRequest.findFirst({ where: { id: requestId, cityId } }),
      this.prisma.department.findFirst({
        where: { id: dto.departmentId, cityId, isActive: true },
      }),
    ]);

    if (!request) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.REQUEST_NOT_FOUND);
    }

    if (!department) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.DEPARTMENT_UNAVAILABLE,
      );
    }

    return this.prisma.cityRequest.update({
      where: { id: requestId },
      data: {
        assignedDepartmentId: department.id,
        status:
          request.status === RequestStatus.OPEN
            ? RequestStatus.IN_PROGRESS
            : request.status,
      },
      include: {
        assignedDepartment: true,
      },
    });
  }

  async updateStatus(
    cityId: string,
    requestId: string,
    userId: string,
    dto: UpdateCityRequestStatusDto,
  ) {
    await this.ensureManagePermission(cityId, userId);

    await this.getCityRequestOrThrow(cityId, requestId);

    if (
      dto.status === RequestStatus.RESOLVED ||
      dto.status === RequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.RESOLVE_REJECT_USE_REPORT,
      );
    }

    return this.prisma.cityRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        resolvedAt: null,
      },
    });
  }

  async createReport(
    cityId: string,
    requestId: string,
    userId: string,
    dto: CreateReportDto,
    files?: Express.Multer.File[],
  ) {
    await this.ensureManagePermission(cityId, userId);

    await this.getCityRequestOrThrow(cityId, requestId);

    if (
      (dto.type === ReportType.RESOLUTION ||
        dto.type === ReportType.REJECTION) &&
      !dto.description?.trim()
    ) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.RESOLUTION_REJECTION_REQUIRES_DESCRIPTION,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          cityRequestId: requestId,
          authorId: userId,
          type: dto.type,
          status: dto.status,
          description: dto.description,
        },
      });

      if (files?.length) {
        const uploaded = await this.uploadReportAttachments(
          cityId,
          requestId,
          report.id,
          files,
        );

        await tx.attachment.createMany({
          data: uploaded.map((attachment) => ({
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            url: attachment.url,
            type: CITY_REQUESTS_CONSTANTS.ATTACHMENT_TYPES.REPORT,
            entityId: report.id,
            entityType: CITY_REQUESTS_CONSTANTS.ENTITY_TYPES.REPORT,
            reportId: report.id,
          })),
        });
      }

      if (dto.status) {
        await tx.cityRequest.update({
          where: { id: requestId },
          data: {
            status: dto.status,
            resolvedAt:
              dto.status === RequestStatus.RESOLVED ||
              dto.status === RequestStatus.REJECTED
                ? new Date()
                : null,
          },
        });
      }

      return tx.report.findUnique({
        where: { id: report.id },
        include: {
          attachments: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });
  }

  async createMessage(
    cityId: string,
    requestId: string,
    userId: string,
    dto: CreateMessageDto,
  ) {
    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId, cityId },
      include: { chat: true },
    });

    if (!request || !request.chat) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.CHAT_NOT_FOUND);
    }

    await this.ensureCanAccessRequest(cityId, userId, request.userId);

    return this.prisma.message.create({
      data: {
        chatId: request.chat.id,
        authorId: userId,
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getMessages(cityId: string, requestId: string, userId: string) {
    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId, cityId },
      include: { chat: true },
    });

    if (!request || !request.chat) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.CHAT_NOT_FOUND);
    }

    await this.ensureCanAccessRequest(cityId, userId, request.userId);

    return this.prisma.message.findMany({
      where: { chatId: request.chat.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getDepartments(cityId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    return this.prisma.department.findMany({
      where: { cityId, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async assertRequestRoomAccess(requestId: string, userId: string) {
    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId },
      select: {
        cityId: true,
        userId: true,
      },
    });

    if (!request) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.REQUEST_NOT_FOUND);
    }

    await this.ensureCanAccessRequest(request.cityId, userId, request.userId);

    return {
      cityId: request.cityId,
      requestId,
    };
  }

  private async ensureCityMembership(cityId: string, userId: string) {
    const membership = await this.prisma.userCity.findUnique({
      where: {
        userId_cityId: {
          userId,
          cityId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(CITY_REQUESTS_ERRORS.USER_NOT_CITY_MEMBER);
    }
  }

  private async ensureManagePermission(cityId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    const hasPermission = await this.rbacService.hasPermission(
      userId,
      cityId,
      PERMISSIONS_KEYS.CITY_REQUEST_MANAGE,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        CITY_REQUESTS_ERRORS.INSUFFICIENT_MANAGE_PERMISSIONS,
      );
    }
  }

  private async ensureCanAccessRequest(
    cityId: string,
    userId: string,
    requestOwnerId: string,
  ) {
    await this.ensureCityMembership(cityId, userId);

    if (requestOwnerId === userId) {
      return;
    }

    await this.ensureManagePermission(cityId, userId);
  }

  private async uploadRequestAttachments(
    cityId: string,
    requestId: string,
    files: Express.Multer.File[],
  ) {
    return Promise.all(
      files.map(async (file) => {
        const uploaded =
          await this.r2StorageService.uploadCityRequestAttachment({
            cityId,
            requestId,
            fileName: file.originalname,
            mimeType: file.mimetype,
            buffer: file.buffer,
          });

        return {
          fileName: file.originalname,
          mimeType: file.mimetype,
          url: uploaded.url,
        };
      }),
    );
  }

  private async uploadReportAttachments(
    cityId: string,
    requestId: string,
    reportId: string,
    files: Express.Multer.File[],
  ) {
    return Promise.all(
      files.map(async (file) => {
        const uploaded =
          await this.r2StorageService.uploadCityRequestAttachment({
            cityId,
            requestId,
            reportId,
            fileName: file.originalname,
            mimeType: file.mimetype,
            buffer: file.buffer,
          });

        return {
          fileName: file.originalname,
          mimeType: file.mimetype,
          url: uploaded.url,
        };
      }),
    );
  }

  private async getCityRequestOrThrow(cityId: string, requestId: string) {
    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId, cityId },
    });

    if (!request) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.REQUEST_NOT_FOUND);
    }

    return request;
  }
}
