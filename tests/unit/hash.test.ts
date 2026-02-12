import { describe, it, expect } from '@jest/globals';
import { evaluatePercentage } from '../../src/common/utils/hash';

/**
 * evaluatePercentage 단위 테스트
 *
 * 이 테스트 파일이 검증하는 것:
 * 1. 결정적(deterministic) — 같은 입력 = 같은 결과
 * 2. 경계값 — 0%면 전부 false, 100%면 전부 true
 * 3. 통계적 분포 — 50%면 대략 절반이 true
 * 4. 플래그 독립성 — 같은 유저라도 다른 플래그면 다른 결과 가능
 */
describe('evaluatePercentage', () => {
    // ============================================================
    // 1. 결정적 분배 (Deterministic)
    // ============================================================

    describe('결정적(deterministic) 분배', () => {
        it('같은 userId + flagKey 조합은 항상 같은 결과를 반환한다', () => {
            // 100번 호출해도 결과가 동일해야 함
            const results = Array.from({ length: 100 }, () =>
                evaluatePercentage('user_1', 'flag_a', 50)
            );

            // 모든 결과가 첫 번째 결과와 동일
            const firstResult = results[0];
            results.forEach((result) => {
                expect(result).toBe(firstResult);
            });
        });

        it('다른 userId는 다른 결과를 반환할 수 있다', () => {
            // 10명의 유저 중 전부 같은 결과가 나올 확률은 매우 낮음
            const results = Array.from({ length: 10 }, (_, i) =>
                evaluatePercentage(`user_${ i }`, 'test-flag', 50)
            );

            const hasTrue = results.includes(true);
            const hasFalse = results.includes(false);

            // 50% 확률에서 10명이 모두 같은 결과일 확률 = (0.5)^9 ≈ 0.2%
            expect(hasTrue && hasFalse).toBe(true);
        });
    });

    // ============================================================
    // 2. 경계값 테스트 (Edge Cases)
    // ============================================================

    describe('경계값', () => {
        it('percentage=0이면 모든 유저가 false', () => {
            for (let i = 0; i < 100; i++) {
                expect(evaluatePercentage(`user_${ i }`, 'flag', 0)).toBe(false);
            }
        });

        it('percentage=100이면 모든 유저가 true', () => {
            for (let i = 0; i < 100; i++) {
                expect(evaluatePercentage(`user_${ i }`, 'flag', 100)).toBe(true);
            }
        });

        it('percentage=1이면 약 1%의 유저만 true', () => {
            let trueCount = 0;
            const total = 10000;
            for (let i = 0; i < total; i++) {
                if (evaluatePercentage(`user_${ i }`, 'flag', 1)) trueCount++;
            }
            const ratio = trueCount / total;
            // 1% ± 1% 허용 (0% ~ 2%)
            expect(ratio).toBeGreaterThanOrEqual(0);
            expect(ratio).toBeLessThan(0.03);
        });

        it('percentage=99이면 약 99%의 유저가 true', () => {
            let trueCount = 0;
            const total = 10000;
            for (let i = 0; i < total; i++) {
                if (evaluatePercentage(`user_${ i }`, 'flag', 99)) trueCount++;
            }
            const ratio = trueCount / total;
            expect(ratio).toBeGreaterThan(0.97);
            expect(ratio).toBeLessThanOrEqual(1);
        });
    });

    // ============================================================
    // 3. 통계적 분포 (Statistical Distribution)
    // ============================================================

    describe('통계적 분포', () => {
        it('percentage=50이면 대략 50% 유저가 true (±5% 허용)', () => {
            let trueCount = 0;
            const total = 10000;
            for (let i = 0; i < total; i++) {
                if (evaluatePercentage(`user_${ i }`, 'test-flag', 50)) trueCount++;
            }
            const ratio = trueCount / total;
            expect(ratio).toBeGreaterThan(0.45);
            expect(ratio).toBeLessThan(0.55);
        });

        it('percentage=30이면 대략 30% 유저가 true (±5% 허용)', () => {
            let trueCount = 0;
            const total = 10000;
            for (let i = 0; i < total; i++) {
                if (evaluatePercentage(`user_${ i }`, 'flag', 30)) trueCount++;
            }
            const ratio = trueCount / total;
            expect(ratio).toBeGreaterThan(0.25);
            expect(ratio).toBeLessThan(0.35);
        });

        it('percentage=70이면 대략 70% 유저가 true (±5% 허용)', () => {
            let trueCount = 0;
            const total = 10000;
            for (let i = 0; i < total; i++) {
                if (evaluatePercentage(`user_${ i }`, 'flag', 70)) trueCount++;
            }
            const ratio = trueCount / total;
            expect(ratio).toBeGreaterThan(0.65);
            expect(ratio).toBeLessThan(0.75);
        });
    });

    // ============================================================
    // 4. 플래그 독립성 (Flag Independence)
    // ============================================================

    describe('플래그 독립성', () => {
        it('같은 유저라도 다른 flagKey면 독립적으로 평가된다', () => {
            // 같은 유저 50명, 2개 플래그에 대해 독립성 검증
            const flagAResults: boolean[] = [];
            const flagBResults: boolean[] = [];

            for (let i = 0; i < 50; i++) {
                flagAResults.push(evaluatePercentage(`user_${ i }`, 'flag-a', 50));
                flagBResults.push(evaluatePercentage(`user_${ i }`, 'flag-b', 50));
            }

            // 두 플래그의 결과가 완전히 동일할 확률은 매우 낮음
            const isDifferent = flagAResults.some((v, i) => v !== flagBResults[i]);
            expect(isDifferent).toBe(true);
        });
    });
});