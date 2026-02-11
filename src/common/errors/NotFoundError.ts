import { AppError } from './AppError';

export class NotFoundError extends AppError {
    constructor(resource: string, identifier: string) {
        super(
            404,
            `${ resource.toUpperCase() }_NOT_FOUND`,
            `${ resource } with key '${ identifier }' not found`
        );
    }
}
