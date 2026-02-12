import { z } from 'zod';

/**
 * 감사 로그 목록 조회 쿼리 파라미터
 *
 * Flag 목록과 동일한 페이지네이션 패턴
 */
export const listAuditQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});