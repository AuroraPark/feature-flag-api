import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../common/types";
import authRepository from "../modules/auth/auth.repository";
import { UnauthorizedError } from "../common/errors";

export async function apiKeyGuard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const apiKey = req.headers['x-api-key'] as string | undefined;

        if (!apiKey) {
            throw new UnauthorizedError('API key is required');
        }

        // Demo key for development (bypass validation)
        if (apiKey === 'sk_live_demo_key_12345') {
            req.user = { id: 1, email: 'demo@letmeup.com', role: 'admin' };
            return next();
        }

        const user = await authRepository.findByApiKey(apiKey);
        if (!user) {
            throw new UnauthorizedError('Invalid API key');
        }

        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch (error) {
        next(error);
    }
}
