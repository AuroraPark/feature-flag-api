import { describe, it, expect, jest, beforeEach } from '@jest/globals';

/**
 * EvaluateService 단위 테스트
 *
 * 이 테스트는 evaluate.service.ts의 doEvaluate 로직을 검증합니다.
 * DB/Redis 의존성을 Mock으로 대체하여 순수 로직만 테스트.
 *
 * Mock이란?
 * → 실제 모듈 대신 가짜 구현을 주입하는 것
 * → DB에 접속하지 않고도 "DB에서 이런 데이터가 오면 결과가 어떤지" 테스트 가능
 */

// ============================================================
// Mock 설정 — 실제 모듈을 가짜로 대체
// ============================================================

// Redis Mock: 모든 명령을 가짜로 대체
jest.mock('../../src/config/redis', () => ({
    get: jest.fn<() => Promise<null>>().mockResolvedValue(null),
    setex: jest.fn<() => Promise<string>>().mockResolvedValue('OK'),
    del: jest.fn<() => Promise<number>>().mockResolvedValue(1),
    keys: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
}));

// Flag Repository Mock: DB 조회를 가짜 데이터로 대체
jest.mock('../../src/modules/flag/flag.repository', () => ({
    findByKey: jest.fn(),
}));

import evaluateService from '../../src/modules/evaluate/evaluate.service';
import flagRepository from '../../src/modules/flag/flag.repository';

// flagRepository.findByKey를 Mock 함수로 타입 캐스팅
const mockFindByKey = flagRepository.findByKey as jest.MockedFunction<typeof flagRepository.findByKey>;

/**
 * 가짜 Flag 데이터를 만드는 헬퍼
 *
 * Sequelize 모델 인스턴스를 흉내 내는 객체.
 * get({ plain: true })를 호출하면 plain 객체를 반환하도록 설정.
 */
function createMockFlag(overrides: Partial<{
    key: string;
    type: string;
    enabled: boolean;
    percentage: number;
    targets: Array<{ userId: string }>;
}> = {}): any {
    const data = {
        id: 1,
        key: overrides.key || 'test-flag',
        name: 'Test Flag',
        type: overrides.type || 'boolean',
        enabled: overrides.enabled ?? true,
        percentage: overrides.percentage ?? 0,
        targets: overrides.targets || [],
        createdBy: 1,
    };

    return {
        ...data,
        get: ({ plain }: { plain: boolean }) => plain ? data : data,
    };
}

describe('EvaluateService', () => {
    // 각 테스트 전에 Mock 초기화
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================
    // FLAG_NOT_FOUND 테스트
    // ============================================================

    describe('존재하지 않는 플래그', () => {
        it('DB에 없는 flagKey → FLAG_NOT_FOUND 반환', async () => {
            mockFindByKey.mockResolvedValue(null);

            const result = await evaluateService.evaluate('non-existent', 'user_1');

            expect(result).toEqual({
                flagKey: 'non-existent',
                enabled: false,
                reason: 'FLAG_NOT_FOUND',
            });
        });
    });

    // ============================================================
    // FLAG_DISABLED 테스트
    // ============================================================

    describe('비활성화된 플래그', () => {
        it('enabled=false면 타입에 관계없이 FLAG_DISABLED 반환', async () => {
            // boolean 타입이지만 disabled
            mockFindByKey.mockResolvedValue(
                createMockFlag({ type: 'boolean', enabled: false })
            );
            const result1 = await evaluateService.evaluate('test-flag', 'user_1');
            expect(result1.reason).toBe('FLAG_DISABLED');
            expect(result1.enabled).toBe(false);

            // percentage 타입이지만 disabled
            mockFindByKey.mockResolvedValue(
                createMockFlag({ type: 'percentage', enabled: false, percentage: 100 })
            );
            const result2 = await evaluateService.evaluate('test-flag', 'user_2');
            expect(result2.reason).toBe('FLAG_DISABLED');
            expect(result2.enabled).toBe(false);

            // user_target 타입이지만 disabled
            mockFindByKey.mockResolvedValue(
                createMockFlag({
                    type: 'user_target',
                    enabled: false,
                    targets: [{ userId: 'user_3' }],
                })
            );
            const result3 = await evaluateService.evaluate('test-flag', 'user_3');
            expect(result3.reason).toBe('FLAG_DISABLED');
            expect(result3.enabled).toBe(false);
        });
    });

    // ============================================================
    // Boolean 타입 테스트
    // ============================================================

    describe('Boolean 타입 평가', () => {
        it('enabled=true → BOOLEAN_ON', async () => {
            mockFindByKey.mockResolvedValue(
                createMockFlag({ type: 'boolean', enabled: true })
            );

            const result = await evaluateService.evaluate('test-flag', 'user_1');

            expect(result).toEqual({
                flagKey: 'test-flag',
                enabled: true,
                reason: 'BOOLEAN_ON',
            });
        });
    });

    // ============================================================
    // Percentage 타입 테스트
    // ============================================================

    describe('Percentage 타입 평가', () => {
        it('percentage에 포함된 유저 → PERCENTAGE_MATCH', async () => {
            // percentage=100이면 모든 유저가 포함
            mockFindByKey.mockResolvedValue(
                createMockFlag({ type: 'percentage', enabled: true, percentage: 100 })
            );

            const result = await evaluateService.evaluate('test-flag', 'any-user');

            expect(result.reason).toBe('PERCENTAGE_MATCH');
            expect(result.enabled).toBe(true);
        });

        it('percentage에 미포함된 유저 → PERCENTAGE_MISS', async () => {
            // percentage=0이면 모든 유저가 미포함
            mockFindByKey.mockResolvedValue(
                createMockFlag({ type: 'percentage', enabled: true, percentage: 0 })
            );

            const result = await evaluateService.evaluate('test-flag', 'any-user');

            expect(result.reason).toBe('PERCENTAGE_MISS');
            expect(result.enabled).toBe(false);
        });
    });

    // ============================================================
    // User Target 타입 테스트
    // ============================================================

    describe('User Target 타입 평가', () => {
        it('타깃 목록에 포함된 유저 → USER_TARGETED', async () => {
            mockFindByKey.mockResolvedValue(
                createMockFlag({
                    type: 'user_target',
                    enabled: true,
                    targets: [{ userId: 'user_vip' }, { userId: 'user_beta' }],
                })
            );

            const result = await evaluateService.evaluate('test-flag', 'user_vip');

            expect(result.reason).toBe('USER_TARGETED');
            expect(result.enabled).toBe(true);
        });

        it('타깃 목록에 없는 유저 → USER_NOT_TARGETED', async () => {
            mockFindByKey.mockResolvedValue(
                createMockFlag({
                    type: 'user_target',
                    enabled: true,
                    targets: [{ userId: 'user_vip' }],
                })
            );

            const result = await evaluateService.evaluate('test-flag', 'user_normal');

            expect(result.reason).toBe('USER_NOT_TARGETED');
            expect(result.enabled).toBe(false);
        });
    });

    // ============================================================
    // Bulk 평가 테스트
    // ============================================================

    describe('Bulk 평가', () => {
        it('여러 플래그를 한번에 평가', async () => {
            // 첫 번째 호출: boolean 플래그 (enabled)
            mockFindByKey
                .mockResolvedValueOnce(
                    createMockFlag({ key: 'flag-a', type: 'boolean', enabled: true })
                )
                // 두 번째 호출: boolean 플래그 (disabled)
                .mockResolvedValueOnce(
                    createMockFlag({ key: 'flag-b', type: 'boolean', enabled: false })
                )
                // 세 번째 호출: 존재하지 않는 플래그
                .mockResolvedValueOnce(null);

            const results = await evaluateService.bulkEvaluate(
                ['flag-a', 'flag-b', 'flag-c'],
                'user_1'
            );

            expect(results).toHaveLength(3);
            expect(results[0].reason).toBe('BOOLEAN_ON');
            expect(results[1].reason).toBe('FLAG_DISABLED');
            expect(results[2].reason).toBe('FLAG_NOT_FOUND');
        });
    });
});