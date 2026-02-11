import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../common/types";
import authRepository from "../modules/auth/auth.repository";

export async function apiKeyGuard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    // TODO: Implement API key validation logic
    try {
        const apiKey = req.headers["x-api-key"] as string | undefined;

        if (!apiKey) {
            throw new Error("API key is required");
        }

        const user = await authRepository.findByApiKey(apiKey);
        if (!user) {
            throw new Error("Invalid API key");
        }

        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch (error) {
        next(error);
    }
}
