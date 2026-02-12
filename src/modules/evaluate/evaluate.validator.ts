import { z } from 'zod';

/**
 * 단일 플래그 평가 요청 스키마
 */
export const evaluateSchema = z.object({
    flagKey: z.string().min(1, 'flagKey is required'),
    context: z.object({
        userId: z.string().min(1, 'userId is required'),
        attributes: z.record(z.string(), z.unknown()).optional(), // optional for now
    }),
});

/**
 * 벌크 평가 요청 스키마
 */
export const bulkEvaluateSchema = z.object({
    flagKeys: z.array(z.string().min(1)).min(1, 'At least one flagKey is required').max(50),
    context: z.object({
        userId: z.string().min(1, 'userId is required'),
        attributes: z.record(z.string(), z.unknown()).optional(),
    }),
});