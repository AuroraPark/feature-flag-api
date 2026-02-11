import { Response } from 'express';

interface SuccessResponse<T> {
    success: true;
    data: T;
}

interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        statusCode: number;
    };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
    const response: SuccessResponse<T> = { success: true, data };
    res.status(statusCode).json(response);
}

export function sendError(
    res: Response,
    code: string,
    message: string,
    statusCode: number
): void {
    const response: ErrorResponse = {
        success: false,
        error: { code, message, statusCode },
    };
    res.status(statusCode).json(response);
}
