import Redis from "ioredis";
import { LRUCache } from "lru-cache";

export class CacheService {
  private readonly memory = new LRUCache<string, any>({ max: 1000 });
  private readonly redis?: any;

  public constructor(redisUrl?: string) {
    if (redisUrl) {
      const RedisCtor = (Redis as any).default ?? (Redis as any);
      this.redis = new RedisCtor(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });
      this.redis.connect().catch(() => undefined);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const memoryHit = this.memory.get(key) as T | undefined;
    if (memoryHit !== undefined) {
      return memoryHit;
    }

    if (!this.redis) {
      return null;
    }

    const payload = await this.redis.get(key);
    if (!payload) {
      return null;
    }

    const value = JSON.parse(payload) as T;
    this.memory.set(key, value);
    return value;
  }

  public async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.memory.set(key, value);
    if (!this.redis) {
      return;
    }
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  public async del(prefixOrKey: string): Promise<void> {
    this.memory.delete(prefixOrKey);
    if (!this.redis) {
      return;
    }

    if (!prefixOrKey.includes("*")) {
      await this.redis.del(prefixOrKey);
      return;
    }

    const stream = this.redis.scanStream({ match: prefixOrKey, count: 500 });
    for await (const keys of stream) {
      if (Array.isArray(keys) && keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
}
