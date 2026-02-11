import { Request, Response } from 'express';
import { sendError } from '../common/utils/apiResponse';

export function notFoundHandler(_req: Request, res: Response): void {
    sendError(res, 'NOT_FOUND', 'The requested resource was not found', 404);
}
