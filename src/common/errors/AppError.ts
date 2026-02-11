export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(statusCode: number, code: string, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // 예측 가능한 에러 vs 프로그래밍 에러 구분

        // prototype chain 복원 (TS에서 Error 상속 시 필수)
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
