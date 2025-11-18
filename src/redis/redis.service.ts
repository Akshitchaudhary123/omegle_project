import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

  async set(key: string, value: any) {
    await this.redis.set(key, JSON.stringify(value));
  }

  async setWithExpiry(key: string, value: any, seconds: number) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.setex(key, seconds, stringValue);
  }

  async get(key: string) {
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : null;
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async sadd(setName: string, value: string) {
    await this.redis.sadd(setName, value);
  }

  async srem(setName: string, value: string) {
    await this.redis.srem(setName, value);
  }

  async spop(setName: string) {
    return await this.redis.spop(setName);
  }

  async smembers(setName: string) {
    return await this.redis.smembers(setName);
  }
}
