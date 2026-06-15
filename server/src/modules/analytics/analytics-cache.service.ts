import { Injectable } from '@nestjs/common';
import { ANALYTICS_CACHE_TTL_MS } from './analytics.constants';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

// In-memory TTL cache for read-only analytics aggregates. Process-local and
// dependency-free; swap for a shared store if scaled horizontally.
@Injectable()
export class AnalyticsCacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs = ANALYTICS_CACHE_TTL_MS;

  async wrap<T>(key: string, producer: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.value as T;
    }

    const value = await producer();
    this.store.set(key, { value, expiresAt: now + this.ttlMs });
    return value;
  }
}
