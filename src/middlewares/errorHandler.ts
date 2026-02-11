import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { sendError } from '../common/utils/apiResponse';

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    if (err instanceof AppError) {
        sendError(res, err.code, err.message, err.statusCode);
        return;
    }

    // 2. Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        sendError(
            res,
            'DUPLICATE_RESOURCE',
            'A resource with this value already exists',
            409
        );
        return;
    }

    // 3. Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        sendError(res, 'VALIDATION_ERROR', err.message, 400);
        return;
    }

    // 4. Default error
    console.error('[UNHANDLED_ERROR]', err);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500);
}
