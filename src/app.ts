import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestLogger } from './middlewares/requestLogger';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import authRouter from './modules/auth/auth.routes';
import { authGuard } from './middlewares/authGuard';
import flagRouter from './modules/flag/flag.routes';
import { swaggerSpec } from './config/swagger';
import swaggerUi from 'swagger-ui-express';
import evaluateRouter from './modules/evaluate/evaluate.routes';
import { apiKeyGuard } from './middlewares/apiKeyGuard';
import sequelize from './config/database';
import redis from './config/redis';

const app = express();

// --- Security & Parsing ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// --- Health Check ---
app.get('/healthz', async (_req, res) => {
  const checks: Record<string, string> = {};

  // DB 연결 확인
  try {
    await sequelize.authenticate();
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  // Redis 연결 확인
  try {
    await redis.ping();
    checks.redis = 'connected';
  } catch {
    checks.redis = 'disconnected';
  }

  const isHealthy = checks.database === 'connected' && checks.redis === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Routes (추후 각 모듈에서 추가) ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/flags', authGuard as express.RequestHandler, flagRouter);
app.use('/api/v1/evaluate', apiKeyGuard as express.RequestHandler, evaluateRouter);

// --- 404 Handler ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
