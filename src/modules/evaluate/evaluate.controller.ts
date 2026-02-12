import { Request, Response, NextFunction } from 'express';
import evaluateService from './evaluate.service';

class EvaluateController {
    /**
     * POST /api/v1/evaluate
     * 단일 플래그 평가
     */
    async evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { flagKey, context } = req.body;

            const result = await evaluateService.evaluate(flagKey, context.userId);

            res.json({
                ...result,
                evaluatedAt: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/evaluate/bulk
     * 다중 플래그 일괄 평가
     */
    async bulkEvaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { flagKeys, context } = req.body;

            const evaluations = await evaluateService.bulkEvaluate(flagKeys, context.userId);

            res.json({
                evaluations,
                evaluatedAt: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new EvaluateController();