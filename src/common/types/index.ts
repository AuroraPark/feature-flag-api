import { Request } from "express";

export interface AuthUser {
    id: number;
    email: string;
    role: 'admin' | 'viewer';
}

// 인증된 요청 타입
export interface AuthenticatedRequest extends Request {
    user: AuthUser;
}

// 페이지네이션 파라미터 타입
export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}