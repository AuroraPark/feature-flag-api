import { AppError } from './AppError';

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, 'VALIDATION_ERROR', message);
    }
}
