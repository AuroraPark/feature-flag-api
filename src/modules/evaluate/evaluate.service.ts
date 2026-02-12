import redis from '../../config/redis';
import flagRepository from '../flag/flag.repository';
import { evaluatePercentage } from '../../common/utils/hash';


const EVAL_CACHE_TTL = 60;
const FLAG_DATA_TTL = 300;

const REASON = {
    BOOLEAN_ON: 'BOOLEAN_ON',
    BOOLEAN_OFF: 'BOOLEAN_OFF',
    PERCENTAGE_MATCH: 'PERCENTAGE_MATCH',
    PERCENTAGE_MISS: 'PERCENTAGE_MISS',
    USER_TARGETED: 'USER_TARGETED',
    USER_NOT_TARGETED: 'USER_NOT_TARGETED',
    FLAG_DISABLED: 'FLAG_DISABLED',
    FLAG_NOT_FOUND: 'FLAG_NOT_FOUND',
} as const;

// 평가 결과 타입
interface EvaluationResult {
    flagKey: string;
    enabled: boolean;
    reason: string;
}

class EvaluateService {

    /**
     * 단일 플래그 평가
     */
    async evaluate(flagKey: string, userId: string): Promise<EvaluationResult> {
        const cached = await this.getCachedResult(flagKey, userId);
        if (cached) {
            return cached;
        }

        const result = await this.doEvaluate(flagKey, userId);

        await this.cacheResult(flagKey, userId, result);

        return result;
    }

    /**
     * 다중 플래그 벌크 평가
     *
     */
    async bulkEvaluate(flagKeys: string[], userId: string): Promise<EvaluationResult[]> {
        const results = await Promise.all(
            flagKeys.map((flagKey) => this.evaluate(flagKey, userId))
        );
        return results;
    }

    /**
     * 캐시 무효화 (Flag 수정/토글/삭제 시 호출)
     *
     */
    async invalidateCache(flagKey: string): Promise<void> {
        try {
            await redis.del(`flag:data:${ flagKey }`);

            const evalKeys = await redis.keys(`flag:eval:${ flagKey }:*`);
            if (evalKeys.length > 0) {
                await redis.del(...evalKeys);
            }
        } catch (error) {
            console.error('[Cache] Invalidation failed:', error);
        }
    }

    private async doEvaluate(flagKey: string, userId: string): Promise<EvaluationResult> {
        const flag = await this.getFlagData(flagKey);

        if (!flag) {
            return { flagKey, enabled: false, reason: REASON.FLAG_NOT_FOUND };
        }

        if (!flag.enabled) {
            return { flagKey, enabled: false, reason: REASON.FLAG_DISABLED };
        }

        switch (flag.type) {
            case 'boolean':
                return { flagKey, enabled: true, reason: REASON.BOOLEAN_ON };

            case 'percentage': {
                const isMatch = evaluatePercentage(userId, flagKey, flag.percentage);
                return {
                    flagKey,
                    enabled: isMatch,
                    reason: isMatch ? REASON.PERCENTAGE_MATCH : REASON.PERCENTAGE_MISS,
                };
            }

            case 'user_target': {
                const isTargeted = flag.targetUserIds.includes(userId);
                return {
                    flagKey,
                    enabled: isTargeted,
                    reason: isTargeted ? REASON.USER_TARGETED : REASON.USER_NOT_TARGETED,
                };
            }

            default:
                return { flagKey, enabled: false, reason: REASON.FLAG_DISABLED };
        }
    }

    /**
     * 플래그 데이터 조회 (Redis → DB fallback)
     *
     * Redis에 플래그 데이터가 캐시되어 있으면 바로 반환,
     * 없으면 DB에서 조회 후 Redis에 캐시
     */
    private async getFlagData(flagKey: string): Promise<{
        type: string;
        enabled: boolean;
        percentage: number;
        targetUserIds: string[];
    } | null> {
        const cacheKey = `flag:data:${ flagKey }`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('[Cache] Read failed, falling back to DB:', error);
        }

        const flag = await flagRepository.findByKey(flagKey);
        if (!flag) return null;

        const plain = flag.get({ plain: true }) as any;
        const flagData = {
            type: plain.type,
            enabled: plain.enabled,
            percentage: plain.percentage,
            targetUserIds: plain.targets
                ? plain.targets.map((t: { userId: string }) => t.userId)
                : [],
        };

        try {
            await redis.setex(cacheKey, FLAG_DATA_TTL, JSON.stringify(flagData));
        } catch (error) {
            console.error('[Cache] Write failed:', error);
        }

        return flagData;
    }

    /**
     * 평가 결과 캐시에서 조회
     */
    private async getCachedResult(flagKey: string, userId: string): Promise<EvaluationResult | null> {
        try {
            const cacheKey = `flag:eval:${ flagKey }:${ userId }`;
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('[Cache] Eval cache read failed:', error);
        }
        return null;
    }

    /**
     * 평가 결과를 캐시에 저장
     */
    private async cacheResult(flagKey: string, userId: string, result: EvaluationResult): Promise<void> {
        try {
            const cacheKey = `flag:eval:${ flagKey }:${ userId }`;
            await redis.setex(cacheKey, EVAL_CACHE_TTL, JSON.stringify(result));
        } catch (error) {
            console.error('[Cache] Eval cache write failed:', error);
        }
    }
}

export default new EvaluateService();