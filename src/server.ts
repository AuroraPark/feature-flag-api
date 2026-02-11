import app from './app';
import sequelize from './config/database';
import redis from './config/redis';
import { ENV } from './config/env';

async function bootstrap(): Promise<void> {
  try {
    // 1. DB 연결 확인
    await sequelize.authenticate();
    console.log('[MySQL] Connection established successfully');

    // 2. 모델 동기화 (개발용 — 프로덕션에서는 마이그레이션 사용)
    if (ENV.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('[MySQL] Models synchronized');
    }

    // 3. Redis 연결 확인 (ioredis는 생성 시 자동 연결)
    await redis.ping();
    console.log('[Redis] Ping successful');

    // 4. 서버 시작
    app.listen(ENV.PORT, () => {
      console.log(`[Server] Running on http://localhost:${ ENV.PORT }`);
      console.log(`[Server] Environment: ${ ENV.NODE_ENV }`);
      console.log(
        `[Server] Health check: http://localhost:${ ENV.PORT }/healthz`
      );
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
