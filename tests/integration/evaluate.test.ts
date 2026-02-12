import request from 'supertest';
import app from '../../src/app';
import { setupTestDB, cleanupTestDB, teardownTestDB, flushRedis } from '../setup';
import { createUserAndGetToken, createTestFlag } from '../helpers';
import { beforeAll, beforeEach, describe, afterAll, it, expect } from '@jest/globals';

describe('Evaluate API ★', () => {
    let token: string;
    let apiKey: string;

    beforeAll(async () => {
        await setupTestDB();
    });

    beforeEach(async () => {
        await cleanupTestDB();
        await flushRedis();
        const auth = await createUserAndGetToken();
        token = auth.token;
        apiKey = auth.apiKey;
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    // ============================================================
    // 인증 테스트
    // ============================================================

    describe('API Key 인증', () => {
        it('유효한 API Key → 평가 성공', async () => {
            await createTestFlag(token, {
                key: 'auth-test',
                type: 'boolean',
                enabled: true,
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'auth-test',
                    context: { userId: 'user_1' },
                });

            expect(res.status).toBe(200);
            expect(res.body.flagKey).toBe('auth-test');
        });

        it('잘못된 API Key → 401', async () => {
            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', 'invalid-key')
                .send({
                    flagKey: 'test',
                    context: { userId: 'user_1' },
                });

            expect(res.status).toBe(401);
        });

        it('API Key 없이 요청 → 401', async () => {
            const res = await request(app)
                .post('/api/v1/evaluate')
                .send({
                    flagKey: 'test',
                    context: { userId: 'user_1' },
                });

            expect(res.status).toBe(401);
        });
    });

    // ============================================================
    // 플래그 평가 로직
    // ============================================================

    describe('POST /api/v1/evaluate', () => {
        it('존재하지 않는 flagKey → FLAG_NOT_FOUND', async () => {
            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'non-existent',
                    context: { userId: 'user_1' },
                });

            expect(res.status).toBe(200);
            expect(res.body.enabled).toBe(false);
            expect(res.body.reason).toBe('FLAG_NOT_FOUND');
        });

        it('비활성 플래그 → FLAG_DISABLED', async () => {
            await createTestFlag(token, {
                key: 'disabled-flag',
                type: 'boolean',
                enabled: false,
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'disabled-flag',
                    context: { userId: 'user_1' },
                });

            expect(res.body.enabled).toBe(false);
            expect(res.body.reason).toBe('FLAG_DISABLED');
        });

        it('Boolean ON → BOOLEAN_ON', async () => {
            await createTestFlag(token, {
                key: 'bool-on',
                type: 'boolean',
                enabled: true,
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'bool-on',
                    context: { userId: 'user_1' },
                });

            expect(res.body.enabled).toBe(true);
            expect(res.body.reason).toBe('BOOLEAN_ON');
        });

        it('Percentage 100% → 모든 유저 PERCENTAGE_MATCH', async () => {
            await createTestFlag(token, {
                key: 'percent-100',
                type: 'percentage',
                enabled: true,
                percentage: 100,
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'percent-100',
                    context: { userId: 'any-user' },
                });

            expect(res.body.enabled).toBe(true);
            expect(res.body.reason).toBe('PERCENTAGE_MATCH');
        });

        it('Percentage 0% → 모든 유저 PERCENTAGE_MISS', async () => {
            await createTestFlag(token, {
                key: 'percent-0',
                type: 'percentage',
                enabled: true,
                percentage: 0,
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'percent-0',
                    context: { userId: 'any-user' },
                });

            expect(res.body.enabled).toBe(false);
            expect(res.body.reason).toBe('PERCENTAGE_MISS');
        });

        it('User Target — 타깃 유저 → USER_TARGETED', async () => {
            await createTestFlag(token, {
                key: 'target-flag',
                type: 'user_target',
                enabled: true,
                targetUserIds: ['vip_user', 'beta_user'],
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'target-flag',
                    context: { userId: 'vip_user' },
                });

            expect(res.body.enabled).toBe(true);
            expect(res.body.reason).toBe('USER_TARGETED');
        });

        it('User Target — 일반 유저 → USER_NOT_TARGETED', async () => {
            await createTestFlag(token, {
                key: 'target-flag-2',
                type: 'user_target',
                enabled: true,
                targetUserIds: ['vip_user'],
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'target-flag-2',
                    context: { userId: 'normal_user' },
                });

            expect(res.body.enabled).toBe(false);
            expect(res.body.reason).toBe('USER_NOT_TARGETED');
        });

        it('evaluatedAt 타임스탬프가 포함된다', async () => {
            await createTestFlag(token, {
                key: 'timestamp-test',
                type: 'boolean',
                enabled: true,
            });

            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'timestamp-test',
                    context: { userId: 'user_1' },
                });

            expect(res.body).toHaveProperty('evaluatedAt');
            // ISO 8601 형식 확인
            expect(new Date(res.body.evaluatedAt).toISOString()).toBe(res.body.evaluatedAt);
        });
    });

    // ============================================================
    // Bulk 평가
    // ============================================================

    describe('POST /api/v1/evaluate/bulk', () => {
        it('여러 플래그를 한번에 평가', async () => {
            await createTestFlag(token, { key: 'bulk-a', type: 'boolean', enabled: true });
            await createTestFlag(token, { key: 'bulk-b', type: 'boolean', enabled: false });

            const res = await request(app)
                .post('/api/v1/evaluate/bulk')
                .set('x-api-key', apiKey)
                .send({
                    flagKeys: ['bulk-a', 'bulk-b', 'bulk-nonexist'],
                    context: { userId: 'user_1' },
                });

            expect(res.status).toBe(200);
            expect(res.body.evaluations).toHaveLength(3);

            // 결과 순서가 요청 순서와 동일
            expect(res.body.evaluations[0].flagKey).toBe('bulk-a');
            expect(res.body.evaluations[0].reason).toBe('BOOLEAN_ON');

            expect(res.body.evaluations[1].flagKey).toBe('bulk-b');
            expect(res.body.evaluations[1].reason).toBe('FLAG_DISABLED');

            expect(res.body.evaluations[2].flagKey).toBe('bulk-nonexist');
            expect(res.body.evaluations[2].reason).toBe('FLAG_NOT_FOUND');
        });
    });

    // ============================================================
    // 입력 검증
    // ============================================================

    describe('입력 검증', () => {
        it('flagKey 누락 → 400', async () => {
            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    context: { userId: 'user_1' },
                });

            expect(res.status).toBe(400);
        });

        it('userId 누락 → 400', async () => {
            const res = await request(app)
                .post('/api/v1/evaluate')
                .set('x-api-key', apiKey)
                .send({
                    flagKey: 'test',
                    context: {},
                });

            expect(res.status).toBe(400);
        });
    });
});