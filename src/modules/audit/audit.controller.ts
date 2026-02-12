import { Response, NextFunction } from 'express';
import auditService from './audit.service';
import { sendSuccess } from '../../common/utils/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

class AuditController {
    /**
     * GET /api/v1/flags/:key/audit
     * 특정 플래그의 변경 이력 조회
     */
    async findByFlag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { key } = req.params;
            const { page, limit } = req.query as any;

            const result = await auditService.findByFlagKey(key as string, {
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20,
            });
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/audit
     * 전체 변경 이력 조회
     */
    async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = req.query as any;

            const result = await auditService.findAll({
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20,
            });
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuditController();