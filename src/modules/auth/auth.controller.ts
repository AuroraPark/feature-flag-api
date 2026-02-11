import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { sendSuccess } from '../../common/utils/apiResponse';

class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, name } = req.body;
            const user = await authService.register(email, password, name);
            sendSuccess(res, user, 201);
        } catch (error) {
            next(error);  // 에러를 글로벌 에러 핸들러로 전달
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();