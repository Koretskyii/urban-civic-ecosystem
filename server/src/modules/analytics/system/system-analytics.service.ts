import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AnalyticsQueryDto } from '../dto';
import type { AnalyticsSection, ChartData, KpiCard } from '../dto';
import { resolveRange } from '../helpers/time-buckets';
import { AnalyticsCacheService } from '../analytics-cache.service';
import {
  CITY_FUNNEL_ORDER,
  TOP_CITIES,
  TOP_REGIONS,
} from '../analytics.constants';

interface AddedRow {
  label: string;
  added: number;
}

interface TopCityRow {
  name: string;
  activity: number;
}

@Injectable()
export class SystemAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AnalyticsCacheService,
  ) {}

  async getOverview(query: AnalyticsQueryDto): Promise<AnalyticsSection> {
    const { granularity, from, to } = resolveRange(query);
    const key = `system:overview:${granularity}:${from.toISOString()}:${to.toISOString()}`;

    return this.cache.wrap(key, async () => {
      const [kpis, growthChart, funnelChart, regionsChart, topCitiesChart] =
        await Promise.all([
          this.buildKpis(),
          this.buildUserGrowth(query),
          this.buildCityFunnel(),
          this.buildCitiesByRegion(),
          this.buildTopCities(),
        ]);

      return {
        kpis,
        charts: [growthChart, funnelChart, regionsChart, topCitiesChart],
      };
    });
  }

  private async buildKpis(): Promise<KpiCard[]> {
    const [cities, users, activeSurveys, openRequests] = await Promise.all([
      this.prisma.city.count({ where: { deletedAt: null } }),
      this.prisma.user.count(),
      this.prisma.survey.count({ where: { deletedAt: null, status: 'OPEN' } }),
      this.prisma.cityRequest.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
    ]);

    return [
      { id: 'system.cities', label: 'system.cities', value: cities },
      { id: 'system.users', label: 'system.users', value: users },
      {
        id: 'system.activeSurveys',
        label: 'system.activeSurveys',
        value: activeSurveys,
      },
      {
        id: 'system.openRequests',
        label: 'system.openRequests',
        value: openRequests,
      },
    ];
  }

  private async buildUserGrowth(query: AnalyticsQueryDto): Promise<ChartData> {
    const { config, from, to } = resolveRange(query);
    const { unit, interval, fmt } = config;

    const [addedRows, baseRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<AddedRow[]>(
        `
        WITH buckets AS (
          SELECT generate_series(
            date_trunc('${unit}', $1::timestamptz),
            date_trunc('${unit}', $2::timestamptz),
            '${interval}'::interval
          ) AS bucket
        ),
        per AS (
          SELECT date_trunc('${unit}', "createdAt") AS bucket, count(*)::int AS cnt
          FROM "User"
          WHERE "createdAt" >= date_trunc('${unit}', $1::timestamptz)
          GROUP BY 1
        )
        SELECT to_char(b.bucket, '${fmt}') AS label,
               COALESCE(p.cnt, 0)::int AS added
        FROM buckets b
        LEFT JOIN per p ON p.bucket = b.bucket
        ORDER BY b.bucket;
        `,
        from,
        to,
      ),
      this.prisma.$queryRawUnsafe<{ base: number }[]>(
        `SELECT count(*)::int AS base
         FROM "User"
         WHERE "createdAt" < date_trunc('${unit}', $1::timestamptz)`,
        from,
      ),
    ]);

    let cumulative = baseRows[0]?.base ?? 0;
    const cumulativeData = addedRows.map((row) => {
      cumulative += row.added;
      return cumulative;
    });

    return {
      id: 'system.userGrowth',
      kind: 'line',
      title: 'system.userGrowth',
      labels: addedRows.map((row) => row.label),
      series: [
        { label: 'system.totalUsers', data: cumulativeData },
        { label: 'system.newUsers', data: addedRows.map((row) => row.added) },
      ],
    };
  }

  private async buildCityFunnel(): Promise<ChartData> {
    const grouped = await this.prisma.cityCreationRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
    const data = CITY_FUNNEL_ORDER.map((status) => counts.get(status) ?? 0);

    return {
      id: 'system.cityFunnel',
      kind: 'bar',
      title: 'system.cityFunnel',
      labels: CITY_FUNNEL_ORDER,
      series: [{ label: 'system.cityFunnel', data }],
    };
  }

  private async buildCitiesByRegion(): Promise<ChartData> {
    const grouped = await this.prisma.city.groupBy({
      by: ['region'],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    const sorted = grouped
      .map((row) => ({ region: row.region, count: row._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_REGIONS);

    return {
      id: 'system.citiesByRegion',
      kind: 'bar',
      title: 'system.citiesByRegion',
      labels: sorted.map((row) => row.region),
      series: [
        { label: 'system.cities', data: sorted.map((row) => row.count) },
      ],
    };
  }

  private async buildTopCities(): Promise<ChartData> {
    const rows = await this.prisma.$queryRawUnsafe<TopCityRow[]>(
      `
      SELECT c."name" AS name,
             (
               (SELECT count(*) FROM "CityRequest" r WHERE r."cityId" = c."id") +
               (SELECT count(*) FROM "Survey" s WHERE s."cityId" = c."id" AND s."deletedAt" IS NULL) +
               (SELECT count(*) FROM "GeneralNews" n WHERE n."cityId" = c."id" AND n."deletedAt" IS NULL)
             )::int AS activity
      FROM "City" c
      WHERE c."deletedAt" IS NULL
      ORDER BY activity DESC
      LIMIT ${TOP_CITIES};
      `,
    );

    return {
      id: 'system.topCities',
      kind: 'horizontal-bar',
      title: 'system.topCities',
      labels: rows.map((row) => row.name),
      series: [
        { label: 'system.activity', data: rows.map((row) => row.activity) },
      ],
    };
  }
}
