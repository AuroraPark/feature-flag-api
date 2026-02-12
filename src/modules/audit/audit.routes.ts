import { RequestHandler, Router } from 'express';
import auditController from './audit.controller';
import { validateQuery } from '../../middlewares/validate';
import { listAuditQuerySchema } from './audit.validator';

const router = Router();

// GET /api/v1/audit — 전체 감사 로그
router.get(
    '/',
    validateQuery(listAuditQuerySchema),
    auditController.findAll.bind(auditController) as unknown as RequestHandler
);

export default router;