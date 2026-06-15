import { DEFAULT_GRANULARITY, Granularity } from '../dto/analytics-query.dto';

// Per-granularity Postgres primitives. Derived only from the whitelisted
// Granularity enum, so they are safe to inline into raw SQL.
interface GranularityConfig {
  unit: 'day' | 'week' | 'month';
  interval: string;
  fmt: string;
  defaultBuckets: number;
}

export const GRANULARITY_CONFIG: Record<Granularity, GranularityConfig> = {
  day: {
    unit: 'day',
    interval: '1 day',
    fmt: 'YYYY-MM-DD',
    defaultBuckets: 30,
  },
  week: {
    unit: 'week',
    interval: '1 week',
    fmt: 'IYYY-"W"IW',
    defaultBuckets: 12,
  },
  month: {
    unit: 'month',
    interval: '1 month',
    fmt: 'YYYY-MM',
    defaultBuckets: 12,
  },
};

export interface ResolvedRange {
  granularity: Granularity;
  config: GranularityConfig;
  from: Date;
  to: Date;
}

const subtract = (
  date: Date,
  granularity: Granularity,
  amount: number,
): Date => {
  const next = new Date(date);
  if (granularity === 'month') next.setMonth(next.getMonth() - amount);
  else if (granularity === 'week') next.setDate(next.getDate() - amount * 7);
  else next.setDate(next.getDate() - amount);
  return next;
};

// When from/to are omitted, defaults to the last `defaultBuckets` periods.
export const resolveRange = (query: {
  granularity?: Granularity;
  from?: string;
  to?: string;
}): ResolvedRange => {
  const granularity = query.granularity ?? DEFAULT_GRANULARITY;
  const config = GRANULARITY_CONFIG[granularity];

  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : subtract(to, granularity, config.defaultBuckets - 1);

  return { granularity, config, from, to };
};
