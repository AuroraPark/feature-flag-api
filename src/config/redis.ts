import Redis from 'ioredis';
import { ENV } from './env';

const redis = new Redis({
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Connection error:', err.message);
});

export default redis;
