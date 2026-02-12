import jwt from "jsonwebtoken";
import { ConflictError, UnauthorizedError } from "../../common/errors";
import { generateApiKey } from "../../common/utils/generateApiKey";
import authRepository from "./auth.repository";
import bcrypt from "bcryptjs";
import { ENV } from "../../config/env";

const SALT_ROUNDS = 12;

class AuthService {
    async register(email: string, password: string, name: string) {
        // 1. Check if user already exists
        const existing = await authRepository.findByEmail(email);
        if (existing) {
            throw new ConflictError("user", "Email");
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Generate API key
        const apiKey = generateApiKey();

        // 4. Create user
        const user = await authRepository.create({
            email,
            password: hashedPassword,
            name,
            apiKey
        });

        // 5. Return user(without password)
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            apiKey: user.apiKey,
            createdAt: user.createdAt,
        };
    }

    async login(email: string, password: string) {
        // 1. Check if user exists
        const user = await authRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError("Invalid email or password");
        }

        // 3. Generate JWT token
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        const accessToken = jwt.sign(payload, ENV.JWT_SECRET!, { expiresIn: ENV.JWT_EXPIRES_IN });

        return {
            accessToken,
            expiresIn: ENV.JWT_EXPIRES_IN,
        };
    }
}

export default new AuthService();