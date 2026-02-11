import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// --- Security & Parsing ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      statusCode: 404,
    },
  });
});

export default app;