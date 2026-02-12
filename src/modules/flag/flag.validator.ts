import { z } from 'zod';

/**
 * 플래그 생성 스키마
 * .refine()으로 타입별 필수 필드를 교차 검증
 */
export const createFlagSchema = z.object({
    key: z.string()
        .min(1, 'Key is required')
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Key must be kebab-case (lowercase, numbers, hyphens)'),
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    type: z.enum(['boolean', 'percentage', 'user_target']),
    enabled: z.boolean().default(false),
    percentage: z.number().int().min(0).max(100).optional(),
    targetUserIds: z.array(z.string()).optional(),
}).refine(
    (data) => {
        // percentage 타입이면 percentage 값 필수
        if (data.type === 'percentage' && data.percentage === undefined) {
            return false;
        }
        return true;
    },
    { message: 'percentage is required when type is "percentage"', path: ['percentage'] }
).refine(
    (data) => {
        // user_target 타입이면 targetUserIds 필수
        if (data.type === 'user_target' && (!data.targetUserIds || data.targetUserIds.length === 0)) {
            return false;
        }
        return true;
    },
    { message: 'targetUserIds is required when type is "user_target"', path: ['targetUserIds'] }
);

/**
 * 플래그 수정 스키마 (모든 필드 optional — 부분 수정)
 */
export const updateFlagSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    enabled: z.boolean().optional(),
    percentage: z.number().int().min(0).max(100).optional(),
    targetUserIds: z.array(z.string()).optional(),
});

/**
 * 쿼리 파라미터 스키마 (목록 조회용)
 *
 * query string은 항상 string이므로 .coerce로 숫자 변환
 */
export const listFlagsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    type: z.enum(['boolean', 'percentage', 'user_target']).optional(),
});