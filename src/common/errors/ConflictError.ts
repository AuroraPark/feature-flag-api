import { AppError } from './AppError';

export class ConflictError extends AppError {
    constructor(resource: string, field: string) {
        super(
            409,
            `DUPLICATE_${ resource.toUpperCase() }_${ field.toUpperCase() }`,
            `${ resource } with this ${ field } already exists`
        );
    }
}
