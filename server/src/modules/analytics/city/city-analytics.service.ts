import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RequestStatus } from '@/generated/prisma/enums';
import { AnalyticsQueryDto } from '../dto';
import type { AnalyticsSection, ChartData, KpiCard } from '../dto';
import { resolveRange } from '../helpers/time-buckets';
import { AnalyticsCacheService } from '../analytics-cache.service';
import {
  GEO_ROUND_DECIMALS,
  SECONDS_PER_DAY,
  SEVERITY_ORDER,
  STATUS_ORDER,
  TOP_SURVEYS,
} from '../analytics.constants';

interface TimelineRow {
  label: string;
  submitted: number;
  resolved: number;
}

interface CountTimelineRow {
  label: string;
  count: number;
}

interface AvgDaysRow {
  avg_days: number;
}

interface GeoRow {
  lat: number;
  lng: number;
  weight: number;
}

export interface RequestsGeo {
  points: GeoRow[];
}

@Injectable()
export class CityAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AnalyticsCacheService,
  ) {}

  private cacheKey(section: string, cityId: string, query: AnalyticsQueryDto) {
    const { granularity, from, to } = resolveRange(query);
    return `city:${section}:${cityId}:${granularity}:${from.toISOString()}:${to.toISOString()}`;
  }

  async getRequestsAnalytics(
    cityId: string,
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsSection> {
    await this.ensureCityMembership(cityId, userId);

    return this.cache.wrap(
      this.cacheKey('requests', cityId, query),
      async () => {
        const [statusChart, departmentsChart, kpis, timelineChart] =
          await Promise.all([
            this.buildStatusChart(cityId),
            this.buildDepartmentsChart(cityId),
            this.buildRequestKpis(cityId),
            this.buildRequestsTimeline(cityId, query),
          ]);

        return { kpis, charts: [statusChart, timelineChart, departmentsChart] };
      },
    );
  }

  async getSurveysAnalytics(
    cityId: string,
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsSection> {
    await this.ensureCityMembership(cityId, userId);

    return this.cache.wrap(
      this.cacheKey('surveys', cityId, query),
      async () => {
        const [participationChart, kpis, timelineChart] = await Promise.all([
          this.buildSurveyParticipationChart(cityId),
          this.buildSurveyKpis(cityId),
          this.buildVotesTimeline(cityId, query),
        ]);

        return { kpis, charts: [participationChart, timelineChart] };
      },
    );
  }

  async getAlertsAnalytics(
    cityId: string,
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsSection> {
    await this.ensureCityMembership(cityId, userId);

    return this.cache.wrap(this.cacheKey('alerts', cityId, query), async () => {
      const [severityChart, kpis, timelineChart] = await Promise.all([
        this.buildAlertSeverityChart(cityId),
        this.buildAlertKpis(cityId),
        this.buildAlertsTimeline(cityId, query),
      ]);

      return { kpis, charts: [severityChart, timelineChart] };
    });
  }

  async getRequestsGeo(cityId: string, userId: string): Promise<RequestsGeo> {
    await this.ensureCityMembership(cityId, userId);

    return this.cache.wrap(`city:geo:${cityId}`, async () => {
      const points = await this.prisma.$queryRawUnsafe<GeoRow[]>(
        `SELECT round("locationLat"::numeric, ${GEO_ROUND_DECIMALS})::float AS lat,
                round("locationLng"::numeric, ${GEO_ROUND_DECIMALS})::float AS lng,
                count(*)::int AS weight
         FROM "CityRequest"
         WHERE "cityId" = $1
           AND "locationLat" IS NOT NULL
           AND "locationLng" IS NOT NULL
         GROUP BY 1, 2`,
        cityId,
      );

      return { points };
    });
  }

  private async buildStatusChart(cityId: string): Promise<ChartData> {
    const grouped = await this.prisma.cityRequest.groupBy({
      by: ['status'],
      where: { cityId },
      _count: { _all: true },
    });

    const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
    const data = STATUS_ORDER.map((status) => counts.get(status) ?? 0);
    const total = data.reduce((sum, n) => sum + n, 0);

    return {
      id: 'requests.status',
      kind: 'doughnut',
      title: 'requests.status',
      labels: STATUS_ORDER,
      series: [{ label: 'requests.status', data }],
      meta: { total },
    };
  }

  private async buildDepartmentsChart(cityId: string): Promise<ChartData> {
    const grouped = await this.prisma.cityRequest.groupBy({
      by: ['assignedDepartmentId'],
      where: { cityId, assignedDepartmentId: { not: null } },
      _count: { _all: true },
    });

    const departmentIds = grouped
      .map((row) => row.assignedDepartmentId)
      .filter((id): id is string => id !== null);
    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(departments.map((d) => [d.id, d.name]));

    const sorted = grouped
      .map((row) => ({
        name: nameById.get(row.assignedDepartmentId as string) ?? '—',
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      id: 'requests.byDepartment',
      kind: 'horizontal-bar',
      title: 'requests.byDepartment',
      labels: sorted.map((row) => row.name),
      series: [
        {
          label: 'requests.byDepartment',
          data: sorted.map((row) => row.count),
        },
      ],
    };
  }

  private async buildRequestsTimeline(
    cityId: string,
    query: AnalyticsQueryDto,
  ): Promise<ChartData> {
    const { config, from, to } = resolveRange(query);
    const { unit, interval, fmt } = config;

    const sql = `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('${unit}', $2::timestamptz),
          date_trunc('${unit}', $3::timestamptz),
          '${interval}'::interval
        ) AS bucket
      ),
      submitted AS (
        SELECT date_trunc('${unit}', "createdAt") AS bucket, count(*)::int AS cnt
        FROM "CityRequest"
        WHERE "cityId" = $1
          AND "createdAt" >= date_trunc('${unit}', $2::timestamptz)
        GROUP BY 1
      ),
      resolved AS (
        SELECT date_trunc('${unit}', "resolvedAt") AS bucket, count(*)::int AS cnt
        FROM "CityRequest"
        WHERE "cityId" = $1
          AND "resolvedAt" IS NOT NULL
          AND "resolvedAt" >= date_trunc('${unit}', $2::timestamptz)
        GROUP BY 1
      )
      SELECT to_char(b.bucket, '${fmt}') AS label,
             COALESCE(s.cnt, 0)::int AS submitted,
             COALESCE(r.cnt, 0)::int AS resolved
      FROM buckets b
      LEFT JOIN submitted s ON s.bucket = b.bucket
      LEFT JOIN resolved r ON r.bucket = b.bucket
      ORDER BY b.bucket;
    `;

    const rows = await this.prisma.$queryRawUnsafe<TimelineRow[]>(
      sql,
      cityId,
      from,
      to,
    );

    return {
      id: 'requests.timeline',
      kind: 'line',
      title: 'requests.timeline',
      labels: rows.map((row) => row.label),
      series: [
        { label: 'requests.submitted', data: rows.map((row) => row.submitted) },
        { label: 'requests.resolved', data: rows.map((row) => row.resolved) },
      ],
    };
  }

  private async buildRequestKpis(cityId: string): Promise<KpiCard[]> {
    const [grouped, avgRows] = await Promise.all([
      this.prisma.cityRequest.groupBy({
        by: ['status'],
        where: { cityId },
        _count: { _all: true },
      }),
      this.prisma.$queryRawUnsafe<AvgDaysRow[]>(
        `SELECT COALESCE(
           AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / ${SECONDS_PER_DAY}), 0
         )::float AS avg_days
         FROM "CityRequest"
         WHERE "cityId" = $1 AND "resolvedAt" IS NOT NULL`,
        cityId,
      ),
    ]);

    const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
    const get = (status: RequestStatus) => counts.get(status) ?? 0;

    const total = STATUS_ORDER.reduce((sum, status) => sum + get(status), 0);
    const open = get(RequestStatus.OPEN) + get(RequestStatus.IN_PROGRESS);
    const resolved = get(RequestStatus.RESOLVED);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgResolutionDays = Math.round((avgRows[0]?.avg_days ?? 0) * 10) / 10;

    return [
      { id: 'requests.total', label: 'requests.total', value: total },
      { id: 'requests.open', label: 'requests.open', value: open },
      { id: 'requests.resolved', label: 'requests.resolved', value: resolved },
      {
        id: 'requests.resolutionRate',
        label: 'requests.resolutionRate',
        value: resolutionRate,
        unit: '%',
      },
      {
        id: 'requests.avgResolutionDays',
        label: 'requests.avgResolutionDays',
        value: avgResolutionDays,
        unit: 'd',
      },
    ];
  }

  private async buildSurveyParticipationChart(
    cityId: string,
  ): Promise<ChartData> {
    const surveys = await this.prisma.survey.findMany({
      where: { cityId, deletedAt: null },
      select: { title: true, _count: { select: { votes: true } } },
      orderBy: { createdAt: 'desc' },
      take: TOP_SURVEYS,
    });

    return {
      id: 'surveys.participation',
      kind: 'bar',
      title: 'surveys.participation',
      labels: surveys.map((s) => s.title),
      series: [
        {
          label: 'surveys.votes',
          data: surveys.map((s) => s._count.votes),
        },
      ],
    };
  }

  private async buildVotesTimeline(
    cityId: string,
    query: AnalyticsQueryDto,
  ): Promise<ChartData> {
    const rows = await this.countTimeline('Vote', cityId, query, {
      cityColumn: `"surveyId" IN (SELECT "id" FROM "Survey" WHERE "cityId" = $1)`,
    });

    return {
      id: 'surveys.votesTimeline',
      kind: 'line',
      title: 'surveys.votesTimeline',
      labels: rows.map((row) => row.label),
      series: [{ label: 'surveys.votes', data: rows.map((row) => row.count) }],
    };
  }

  private async buildSurveyKpis(cityId: string): Promise<KpiCard[]> {
    const [total, open, votes] = await Promise.all([
      this.prisma.survey.count({ where: { cityId, deletedAt: null } }),
      this.prisma.survey.count({
        where: { cityId, deletedAt: null, status: 'OPEN' },
      }),
      this.prisma.vote.count({ where: { survey: { cityId } } }),
    ]);

    return [
      { id: 'surveys.total', label: 'surveys.total', value: total },
      { id: 'surveys.open', label: 'surveys.open', value: open },
      { id: 'surveys.totalVotes', label: 'surveys.totalVotes', value: votes },
    ];
  }

  private async buildAlertSeverityChart(cityId: string): Promise<ChartData> {
    const grouped = await this.prisma.alert.groupBy({
      by: ['severity'],
      where: { cityId, deletedAt: null },
      _count: { _all: true },
    });

    const counts = new Map(
      grouped.map((row) => [row.severity, row._count._all]),
    );
    const data = SEVERITY_ORDER.map((severity) => counts.get(severity) ?? 0);

    return {
      id: 'alerts.severity',
      kind: 'doughnut',
      title: 'alerts.severity',
      labels: SEVERITY_ORDER,
      series: [{ label: 'alerts.severity', data }],
      meta: { total: data.reduce((sum, n) => sum + n, 0) },
    };
  }

  private async buildAlertsTimeline(
    cityId: string,
    query: AnalyticsQueryDto,
  ): Promise<ChartData> {
    const rows = await this.countTimeline('Alert', cityId, query, {
      cityColumn: `"cityId" = $1 AND "deletedAt" IS NULL`,
    });

    return {
      id: 'alerts.timeline',
      kind: 'bar',
      title: 'alerts.timeline',
      labels: rows.map((row) => row.label),
      series: [{ label: 'alerts.count', data: rows.map((row) => row.count) }],
    };
  }

  private async buildAlertKpis(cityId: string): Promise<KpiCard[]> {
    const [total, critical] = await Promise.all([
      this.prisma.alert.count({ where: { cityId, deletedAt: null } }),
      this.prisma.alert.count({
        where: { cityId, deletedAt: null, severity: 'CRITICAL' },
      }),
    ]);

    return [
      { id: 'alerts.total', label: 'alerts.total', value: total },
      { id: 'alerts.critical', label: 'alerts.critical', value: critical },
    ];
  }

  // `where.cityColumn` must be a trusted SQL fragment (built from constants,
  // never user input) referencing positional param $1 = cityId.
  private async countTimeline(
    table: 'Vote' | 'Alert',
    cityId: string,
    query: AnalyticsQueryDto,
    where: { cityColumn: string },
  ): Promise<CountTimelineRow[]> {
    const { config, from, to } = resolveRange(query);
    const { unit, interval, fmt } = config;

    const sql = `
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('${unit}', $2::timestamptz),
          date_trunc('${unit}', $3::timestamptz),
          '${interval}'::interval
        ) AS bucket
      ),
      per AS (
        SELECT date_trunc('${unit}', "createdAt") AS bucket, count(*)::int AS cnt
        FROM "${table}"
        WHERE ${where.cityColumn}
          AND "createdAt" >= date_trunc('${unit}', $2::timestamptz)
        GROUP BY 1
      )
      SELECT to_char(b.bucket, '${fmt}') AS label,
             COALESCE(p.cnt, 0)::int AS count
      FROM buckets b
      LEFT JOIN per p ON p.bucket = b.bucket
      ORDER BY b.bucket;
    `;

    return this.prisma.$queryRawUnsafe<CountTimelineRow[]>(
      sql,
      cityId,
      from,
      to,
    );
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
}
