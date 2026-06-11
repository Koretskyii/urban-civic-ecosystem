import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RbacService } from '@/modules/rbac/rbac.service';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import { DOMAIN_EVENT_TYPES } from '@/modules/notifications/domain/domain-events';
import { buildSurveyEventPayload } from '@/modules/notifications/domain/domain-event.factory';
import {
  CastVoteDto,
  CreateSurveyDto,
  GetSurveysQueryDto,
  UpdateSurveyDto,
} from './dto';

const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class SurveysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async createSurvey(cityId: string, userId: string, dto: CreateSurveyDto) {
    await this.ensureCityMembership(cityId, userId);

    return this.prisma.$transaction(async (tx) => {
      const survey = await tx.survey.create({
        data: {
          cityId,
          publisherId: userId,
          title: dto.title.trim(),
          description: dto.description?.trim() ?? null,
          closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
          ...(dto.resultsVisibility !== undefined && { resultsVisibility: dto.resultsVisibility }),
          allowVoteChange: dto.allowVoteChange ?? true,
          options: {
            create: dto.options.map((opt, i) => ({
              text: opt.text.trim(),
              position: i,
            })),
          },
        },
        select: this.surveyBaseSelect(),
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'survey',
          aggregateId: survey.id,
          eventType: DOMAIN_EVENT_TYPES.SURVEY_CREATED,
          payload: buildSurveyEventPayload({
            cityId,
            surveyId: survey.id,
            publisherId: userId,
            title: survey.title,
            closesAt: survey.closesAt,
          }),
        },
      });

      return survey;
    });
  }

  async getCitySurveys(
    cityId: string,
    userId: string,
    query: GetSurveysQueryDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const canManage = await this.canManageSurveys(cityId, userId);
    const includeDeleted = query.includeDeleted === true;

    if (includeDeleted && !canManage) {
      throw new ForbiddenException('You cannot request deleted surveys');
    }

    const take = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.SurveyOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      ...(sortBy === 'createdAt'
        ? []
        : ([{ createdAt: 'desc' }] as Prisma.SurveyOrderByWithRelationInput[])),
      { id: sortOrder },
    ];

    const andConditions: Prisma.SurveyWhereInput[] = [];

    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      andConditions.push({
        OR: [
          { title: { contains: trimmedSearch, mode: 'insensitive' } },
          { description: { contains: trimmedSearch, mode: 'insensitive' } },
        ],
      });
    }

    const surveys = await this.prisma.survey.findMany({
      where: {
        cityId,
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(query.status ? { status: query.status } : {}),
        ...(andConditions.length > 0 ? { AND: andConditions } : {}),
      },
      select: {
        ...this.surveyBaseSelect(),
        _count: { select: { votes: true, options: true } },
        votes: { where: { userId }, select: { surveyOptionId: true }, take: 1 },
      },
      orderBy,
      take: take + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    });

    const hasNextPage = surveys.length > take;
    const page = hasNextPage ? surveys.slice(0, take) : surveys;

    const items = page.map(({ votes, ...rest }) => ({
      ...rest,
      myVote: votes[0]?.surveyOptionId ?? null,
    }));

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async getSurveyById(cityId: string, surveyId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);
    const canManage = await this.canManageSurveys(cityId, userId);

    const survey = await this.prisma.survey.findFirst({
      where: {
        id: surveyId,
        cityId,
        ...(canManage ? {} : { deletedAt: null }),
      },
      select: {
        ...this.surveyBaseSelect(),
        options: {
          select: { id: true, text: true, position: true },
          orderBy: { position: 'asc' },
        },
        votes: { where: { userId }, select: { surveyOptionId: true }, take: 1 },
      },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    const myVote = survey.votes[0]?.surveyOptionId ?? null;
    const isClosed = survey.status === 'CLOSED';
    const hasVoted = myVote !== null;

    const showResults =
      canManage ||
      survey.resultsVisibility === 'LIVE' ||
      (survey.resultsVisibility === 'AFTER_VOTE' && (hasVoted || isClosed)) ||
      (survey.resultsVisibility === 'AFTER_CLOSE' && isClosed);

    const results = showResults ? await this.computeResults(surveyId) : null;

    const { votes: _votes, ...rest } = survey;
    return { ...rest, myVote, results };
  }

  async updateSurvey(
    cityId: string,
    surveyId: string,
    userId: string,
    dto: UpdateSurveyDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.survey.findFirst({
      where: { id: surveyId, cityId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!existing) throw new NotFoundException('Survey not found');
    if (existing.deletedAt) {
      throw new BadRequestException('Cannot edit deleted survey');
    }
    if (existing.status === 'CLOSED') {
      throw new BadRequestException('Cannot edit closed survey');
    }

    const updateData: Prisma.SurveyUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined) {
      updateData.description = dto.description?.trim() ?? null;
    }
    if (dto.resultsVisibility !== undefined) {
      updateData.resultsVisibility = dto.resultsVisibility;
    }
    if (dto.closesAt !== undefined) {
      updateData.closesAt = dto.closesAt ? new Date(dto.closesAt) : null;
    }

    return this.prisma.survey.update({
      where: { id: surveyId },
      data: updateData,
      select: this.surveyBaseSelect(),
    });
  }

  async closeSurvey(cityId: string, surveyId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.survey.findFirst({
      where: { id: surveyId, cityId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        title: true,
        publisherId: true,
        closesAt: true,
      },
    });

    if (!existing) throw new NotFoundException('Survey not found');
    if (existing.deletedAt) {
      throw new BadRequestException('Cannot close deleted survey');
    }
    if (existing.status === 'CLOSED') {
      return { success: true, alreadyClosed: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.survey.update({
        where: { id: surveyId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });

      await tx.domainEventOutbox.create({
        data: {
          aggregateType: 'survey',
          aggregateId: surveyId,
          eventType: DOMAIN_EVENT_TYPES.SURVEY_CLOSED,
          payload: buildSurveyEventPayload({
            cityId,
            surveyId,
            publisherId: existing.publisherId,
            title: existing.title,
            closesAt: null,
          }),
        },
      });
    });

    return { success: true, alreadyClosed: false };
  }

  async softDeleteSurvey(cityId: string, surveyId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    const existing = await this.prisma.survey.findFirst({
      where: { id: surveyId, cityId },
      select: { id: true, deletedAt: true },
    });

    if (!existing) throw new NotFoundException('Survey not found');
    if (existing.deletedAt) {
      return {
        success: true,
        deleted: false,
        message: 'Survey already deleted',
      };
    }

    await this.prisma.survey.update({
      where: { id: surveyId },
      data: { deletedAt: new Date() },
    });

    return { success: true, deleted: true };
  }

  async castVote(
    cityId: string,
    surveyId: string,
    userId: string,
    dto: CastVoteDto,
  ) {
    await this.ensureCityMembership(cityId, userId);

    const now = new Date();

    const survey = await this.prisma.survey.findFirst({
      where: {
        id: surveyId,
        cityId,
        deletedAt: null,
        status: 'OPEN',
        OR: [{ closesAt: null }, { closesAt: { gt: now } }],
      },
      select: { id: true, allowVoteChange: true },
    });

    if (!survey) {
      throw new BadRequestException('Survey is not available for voting');
    }

    const option = await this.prisma.surveyOption.findFirst({
      where: { id: dto.optionId, surveyId },
      select: { id: true },
    });

    if (!option) {
      throw new BadRequestException('Invalid option for this survey');
    }

    const existingVote = await this.prisma.vote.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
      select: { id: true, surveyOptionId: true },
    });

    if (existingVote) {
      if (!survey.allowVoteChange) {
        throw new ConflictException(
          'You have already voted and vote change is not allowed',
        );
      }
      if (existingVote.surveyOptionId === dto.optionId) {
        return { success: true, changed: false };
      }

      await this.prisma.vote.update({
        where: { surveyId_userId: { surveyId, userId } },
        data: { surveyOptionId: dto.optionId },
      });

      return { success: true, changed: true };
    }

    try {
      await this.prisma.vote.create({
        data: { surveyId, surveyOptionId: dto.optionId, userId },
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('You have already voted');
      }
      throw err;
    }

    return { success: true, changed: false };
  }

  async retractVote(cityId: string, surveyId: string, userId: string) {
    await this.ensureCityMembership(cityId, userId);

    const now = new Date();

    const survey = await this.prisma.survey.findFirst({
      where: {
        id: surveyId,
        cityId,
        deletedAt: null,
        status: 'OPEN',
        OR: [{ closesAt: null }, { closesAt: { gt: now } }],
      },
      select: { id: true, allowVoteChange: true },
    });

    if (!survey) {
      throw new BadRequestException('Survey is not available for voting');
    }

    if (!survey.allowVoteChange) {
      throw new ForbiddenException(
        'Vote retraction is not allowed for this survey',
      );
    }

    const existing = await this.prisma.vote.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
      select: { id: true },
    });

    if (!existing) {
      return { success: true, retracted: false, message: 'No vote to retract' };
    }

    await this.prisma.vote.delete({
      where: { surveyId_userId: { surveyId, userId } },
    });

    return { success: true, retracted: true };
  }

  async closeExpiredSurveys(batchSize = 50): Promise<number> {
    const now = new Date();

    const expired = await this.prisma.survey.findMany({
      where: { status: 'OPEN', deletedAt: null, closesAt: { lte: now } },
      select: {
        id: true,
        cityId: true,
        title: true,
        publisherId: true,
      },
      take: batchSize,
    });

    if (expired.length === 0) return 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.survey.updateMany({
        where: { id: { in: expired.map((s) => s.id) } },
        data: { status: 'CLOSED', closedAt: now },
      });

      await tx.domainEventOutbox.createMany({
        data: expired.map((s) => ({
          aggregateType: 'survey',
          aggregateId: s.id,
          eventType: DOMAIN_EVENT_TYPES.SURVEY_CLOSED,
          payload: buildSurveyEventPayload({
            cityId: s.cityId,
            surveyId: s.id,
            publisherId: s.publisherId,
            title: s.title,
            closesAt: null,
          }),
        })),
      });
    });

    return expired.length;
  }

  private async computeResults(surveyId: string) {
    const grouped = await this.prisma.vote.groupBy({
      by: ['surveyOptionId'],
      where: { surveyId },
      _count: { _all: true },
    });

    const total = grouped.reduce((acc, r) => acc + r._count._all, 0);

    return grouped.map((r) => ({
      optionId: r.surveyOptionId,
      count: r._count._all,
      percent: total > 0 ? Math.round((r._count._all / total) * 100) : 0,
    }));
  }

  private surveyBaseSelect() {
    return {
      id: true,
      cityId: true,
      publisherId: true,
      title: true,
      description: true,
      status: true,
      resultsVisibility: true,
      allowVoteChange: true,
      closesAt: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    } as const;
  }

  private async ensureCityMembership(cityId: string, userId: string) {
    const membership = await this.prisma.userCity.findUnique({
      where: { userId_cityId: { userId, cityId } },
      select: { userId: true, isBlocked: true },
    });

    if (!membership || membership.isBlocked) {
      throw new ForbiddenException('User is not a member of this city');
    }
  }

  private async canManageSurveys(cityId: string, userId: string) {
    return this.rbacService.hasPermission(
      userId,
      cityId,
      PERMISSIONS_KEYS.SURVEY_MANAGE,
    );
  }
}
