import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { R2StorageService } from '@/modules/r2/r2.service';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import { ReportType, RequestStatus } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { DOMAIN_EVENT_TYPES } from '@/modules/notifications/domain/domain-events';
import { buildCityRequestEventPayload } from '@/modules/notifications/domain/domain-event.factory';
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

const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 100;

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

    if (
      (files?.length ?? 0) >
      CITY_REQUESTS_CONSTANTS.LIMITS.REQUEST_ATTACHMENTS_MAX
    ) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.TOO_MANY_REQUEST_ATTACHMENTS,
      );
    }

    if (files?.some((file) => !file.mimetype?.startsWith('image/'))) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.INVALID_REQUEST_ATTACHMENT_TYPE,
      );
    }

    const requestId = crypto.randomUUID();
    const attachments = files?.length
      ? await this.uploadRequestAttachments(cityId, requestId, files)
      : [];

    const request = await this.prisma.$transaction(async (tx) => {
      const cityRequest = await tx.cityRequest.create({
        data: {
          id: requestId,
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
          cityRequestId: cityRequest.id,
        },
      });

      if (attachments.length) {
        await tx.attachment.createMany({
          data: attachments.map((attachment) => ({
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            url: attachment.url,
            type: CITY_REQUESTS_CONSTANTS.ATTACHMENT_TYPES.REQUEST,
            cityRequestId: requestId,
          })),
        });
      }

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'city_request',
          aggregateId: cityRequest.id,
          eventType: DOMAIN_EVENT_TYPES.CITY_REQUEST_CREATED,
          payload: buildCityRequestEventPayload({
            cityId,
            requestId: cityRequest.id,
            requesterId: userId,
            actorId: userId,
            requestTitle: cityRequest.title,
            title: cityRequest.title,
          }),
        },
      });

      return tx.cityRequest.findUnique({
        where: { id: requestId },
        include: {
          attachments: true,
          chat: true,
          assignedDepartment: true,
        },
      });
    });

    return this.withPublicAttachmentUrls(request);
  }

  async listRequests(
    cityId: string,
    userId: string,
    query: GetCityRequestsQueryDto,
  ) {
    await this.ensureCityMembership(cityId, userId);
    const requestedScope = query.scope ?? CityRequestScope.ALL;

    const trimmedSearch = query.search?.trim();
    const take = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.CityRequestOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      ...(sortBy === 'createdAt'
        ? []
        : ([
            { createdAt: 'desc' },
          ] satisfies Prisma.CityRequestOrderByWithRelationInput[])),
      { id: sortOrder },
    ];

    const where = {
      cityId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId
        ? { assignedDepartmentId: query.departmentId }
        : {}),
      ...(query.priority !== undefined ? { priority: query.priority } : {}),
      ...(requestedScope === CityRequestScope.MINE ? { userId } : {}),
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
                description: {
                  contains: trimmedSearch,
                  mode: 'insensitive',
                },
              },
              {
                address: {
                  contains: trimmedSearch,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    } satisfies Prisma.CityRequestWhereInput;

    const requests = await this.prisma.cityRequest.findMany({
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
      orderBy,
      take: take + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    });

    const hasNextPage = requests.length > take;
    const items = hasNextPage ? requests.slice(0, take) : requests;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
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

    await this.ensureCityMembership(cityId, userId);

    return this.withPublicRequestAttachmentUrls(request);
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

    const updated = await this.prisma.cityRequest.update({
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

    await this.prisma.domainEventOutbox.create({
      data: {
        aggregateType: 'city_request',
        aggregateId: requestId,
        eventType: DOMAIN_EVENT_TYPES.CITY_REQUEST_ASSIGNED,
        payload: buildCityRequestEventPayload({
          cityId,
          requestId,
          requesterId: request.userId,
          actorId: userId,
          requestTitle: request.title,
          title: request.title,
          status: updated.status,
          departmentId: department.id,
          departmentName: department.name,
        }),
      },
    });

    return updated;
  }

  async updateStatus(
    cityId: string,
    requestId: string,
    userId: string,
    dto: UpdateCityRequestStatusDto,
  ) {
    await this.ensureManagePermission(cityId, userId);

    const request = await this.getCityRequestOrThrow(cityId, requestId);

    if (
      dto.status === RequestStatus.RESOLVED ||
      dto.status === RequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.RESOLVE_REJECT_USE_REPORT,
      );
    }

    const updated = await this.prisma.cityRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        resolvedAt: null,
      },
    });

    await this.prisma.domainEventOutbox.create({
      data: {
        aggregateType: 'city_request',
        aggregateId: requestId,
        eventType: DOMAIN_EVENT_TYPES.CITY_REQUEST_STATUS_UPDATED,
        payload: buildCityRequestEventPayload({
          cityId,
          requestId,
          requesterId: request.userId,
          actorId: userId,
          requestTitle: request.title,
          title: request.title,
          status: updated.status,
        }),
      },
    });

    return updated;
  }

  async createReport(
    cityId: string,
    requestId: string,
    userId: string,
    dto: CreateReportDto,
    files?: Express.Multer.File[],
  ) {
    await this.ensureManagePermission(cityId, userId);

    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId, cityId },
      include: {
        reports: {
          select: {
            type: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.REQUEST_NOT_FOUND);
    }

    if (
      (files?.length ?? 0) >
      CITY_REQUESTS_CONSTANTS.LIMITS.REPORT_ATTACHMENTS_MAX
    ) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.TOO_MANY_REPORT_ATTACHMENTS,
      );
    }

    const isProgressReport = dto.type === ReportType.PROGRESS;
    const isFinalReport =
      dto.type === ReportType.RESOLUTION || dto.type === ReportType.REJECTION;
    const hasFinalReport = request.reports.some(
      (report) =>
        report.type === ReportType.RESOLUTION ||
        report.type === ReportType.REJECTION,
    );
    const isRequestFinal =
      request.status === RequestStatus.RESOLVED ||
      request.status === RequestStatus.REJECTED;

    if (isProgressReport && request.status !== RequestStatus.IN_PROGRESS) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.PROGRESS_REPORT_REQUIRES_IN_PROGRESS,
      );
    }

    if (isFinalReport && (hasFinalReport || isRequestFinal)) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.FINAL_REPORT_ALREADY_EXISTS,
      );
    }

    if (
      (dto.type === ReportType.RESOLUTION ||
        dto.type === ReportType.REJECTION) &&
      !dto.description?.trim()
    ) {
      throw new BadRequestException(
        CITY_REQUESTS_ERRORS.RESOLUTION_REJECTION_REQUIRES_DESCRIPTION,
      );
    }

    const reportStatus =
      dto.type === ReportType.RESOLUTION
        ? RequestStatus.RESOLVED
        : dto.type === ReportType.REJECTION
          ? RequestStatus.REJECTED
          : undefined;

    const reportId = crypto.randomUUID();
    const uploaded = files?.length
      ? await this.uploadReportAttachments(cityId, requestId, reportId, files)
      : [];

    const report = await this.prisma.$transaction(async (tx) => {
      await tx.report.create({
        data: {
          id: reportId,
          cityRequestId: requestId,
          authorId: userId,
          type: dto.type,
          status: reportStatus,
          description: dto.description,
        },
      });

      if (uploaded.length) {
        await tx.attachment.createMany({
          data: uploaded.map((attachment) => ({
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            url: attachment.url,
            type: CITY_REQUESTS_CONSTANTS.ATTACHMENT_TYPES.REPORT,
            reportId,
          })),
        });
      }

      if (reportStatus) {
        await tx.cityRequest.update({
          where: { id: requestId },
          data: {
            status: reportStatus,
            resolvedAt:
              reportStatus === RequestStatus.RESOLVED ||
              reportStatus === RequestStatus.REJECTED
                ? new Date()
                : null,
          },
        });
      }

      return tx.report.findUnique({
        where: { id: reportId },
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

    await this.prisma.domainEventOutbox.create({
      data: {
        aggregateType: 'city_request',
        aggregateId: requestId,
        eventType: DOMAIN_EVENT_TYPES.CITY_REQUEST_REPORT_CREATED,
        payload: buildCityRequestEventPayload({
          cityId,
          requestId,
          requesterId: request.userId,
          actorId: userId,
          requestTitle: request.title,
          title: request.title,
          status: reportStatus ?? request.status,
          reportId,
          reportType: dto.type,
        }),
      },
    });

    return this.withPublicAttachmentUrls(report);
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

    await this.ensureCityMembership(cityId, userId);

    const message = await this.prisma.message.create({
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

    await this.prisma.domainEventOutbox.create({
      data: {
        aggregateType: 'city_request',
        aggregateId: requestId,
        eventType: DOMAIN_EVENT_TYPES.CITY_REQUEST_MESSAGE_CREATED,
        payload: buildCityRequestEventPayload({
          cityId,
          requestId,
          requesterId: request.userId,
          actorId: userId,
          requestTitle: request.title,
          title: request.title,
          messageId: message.id,
          messagePreview: this.toMessagePreview(message.content),
        }),
      },
    });

    return message;
  }

  async getMessages(cityId: string, requestId: string, userId: string) {
    const request = await this.prisma.cityRequest.findFirst({
      where: { id: requestId, cityId },
      include: { chat: true },
    });

    if (!request || !request.chat) {
      throw new NotFoundException(CITY_REQUESTS_ERRORS.CHAT_NOT_FOUND);
    }

    await this.ensureCityMembership(cityId, userId);

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

    await this.ensureCityMembership(request.cityId, userId);

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
      select: {
        isBlocked: true,
      },
    });

    if (!membership || membership.isBlocked) {
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

  private toMessagePreview(content: string) {
    const normalized = content.replace(/\s+/g, ' ').trim();
    return normalized.length > 120
      ? `${normalized.slice(0, 117).trimEnd()}...`
      : normalized;
  }

  private withPublicRequestAttachmentUrls<
    T extends {
      attachments?: Array<{ url: string }> | null;
      reports?: Array<{ attachments?: Array<{ url: string }> | null }> | null;
    },
  >(request: T) {
    this.withPublicAttachmentUrls(request);
    request.reports?.forEach((report) => this.withPublicAttachmentUrls(report));
    return request;
  }

  private withPublicAttachmentUrls<
    T extends { attachments?: Array<{ url: string }> | null } | null,
  >(entity: T) {
    entity?.attachments?.forEach((attachment) => {
      attachment.url = this.r2StorageService.toPublicUrl(attachment.url);
    });
    return entity;
  }
}
