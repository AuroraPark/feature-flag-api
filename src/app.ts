import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestLogger } from './middlewares/requestLogger';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// --- Security & Parsing ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// --- Health Check (DB/Redis 연결 전에도 기본 동작 확인용) ---
app.get('/healthz', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Routes (추후 각 모듈에서 추가) ---

// --- 404 Handler ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
