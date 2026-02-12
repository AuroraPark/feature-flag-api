import { Response, NextFunction } from 'express';
import flagService from './flag.service';
import { sendSuccess } from '../../common/utils/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

class FlagController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const flag = await flagService.create({
                ...req.body,
                createdBy: req.user!.id,    // authGuard가 넣어준 유저 정보
            });
            sendSuccess(res, flag, 201);
        } catch (error) {
            next(error);
        }
    }

    async findAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit, search, type } = req.query as any;
            const result = await flagService.findAll({
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20,
                search,
                type,
            });
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async findByKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const flag = await flagService.findByKey(req.params.key as string);
            sendSuccess(res, flag);
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const flag = await flagService.update(
                req.params.key as string,
                req.body,
                req.user!.id
            );
            sendSuccess(res, flag);
        } catch (error) {
            next(error);
        }
    }

    async toggle(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await flagService.toggle(req.params.key as string, req.user!.id);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            await flagService.delete(req.params.key as string, req.user!.id);
            sendSuccess(res, null, 204);
        } catch (error) {
            next(error);
        }
    }
}

export default new FlagController();