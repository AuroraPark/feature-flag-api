import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../common/errors";
import { AuthenticatedRequest, AuthUser } from "../common/types";
import { NextFunction, Response } from "express";
import { ENV } from "../config/env";

export function authGuard(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("No token provided");
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
            return;
        }
        // jwt.verify failed
        next(new UnauthorizedError("Invalid or expired token"));
    }
}

