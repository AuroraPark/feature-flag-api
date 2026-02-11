import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { sendError } from '../common/utils/apiResponse';

export function validate<T>(schema: ZodType<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues
                    .map((e) => `${ e.path.join('.') }: ${ e.message }`)
                    .join(', ');
                sendError(res, 'VALIDATION_ERROR', message, 400);
                return;
            }
            next(error);
        }
    };
}
