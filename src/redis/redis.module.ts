import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import RedisConfig from './redis.config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(RedisConfig)],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        const redis = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
        });

        redis.on('connect', () => {
          console.log('✅ Redis connected successfully!');
        });

        redis.on('error', (err) => {
          console.error('❌ Redis connection error:', err);
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule { }
