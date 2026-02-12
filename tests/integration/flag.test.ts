import request from 'supertest';
import app from '../../src/app';
import { setupTestDB, cleanupTestDB, teardownTestDB, flushRedis } from '../setup';
import { createUserAndGetToken, createTestFlag } from '../helpers';
import { beforeAll, beforeEach, describe, afterAll, it, expect } from '@jest/globals';

describe('Flag API', () => {
    let token: string;

    beforeAll(async () => {
        await setupTestDB();
    });

    beforeEach(async () => {
        await cleanupTestDB();
        await flushRedis();
        // 매 테스트 전에 새 유저 + 토큰 준비
        const auth = await createUserAndGetToken();
        token = auth.token;
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    // ============================================================
    // 플래그 생성
    // ============================================================

    describe('POST /api/v1/flags', () => {
        it('boolean 타입 플래그 생성 → 201', async () => {
            const res = await request(app)
                .post('/api/v1/flags')
                .set('Authorization', `Bearer ${ token }`)
                .send({
                    key: 'dark-mode',
                    name: 'Dark Mode',
                    type: 'boolean',
                    enabled: false,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.key).toBe('dark-mode');
            expect(res.body.data.type).toBe('boolean');
            expect(res.body.data.enabled).toBe(false);
        });

        it('percentage 타입 — percentage 값 없으면 400', async () => {
            const res = await request(app)
                .post('/api/v1/flags')
                .set('Authorization', `Bearer ${ token }`)
                .send({
                    key: 'ab-test',
                    name: 'AB Test',
                    type: 'percentage',
                    // percentage 누락!
                });

            expect(res.status).toBe(400);
        });

        it('중복 key → 409 Conflict', async () => {
            await createTestFlag(token, { key: 'dup-flag' });

            const res = await request(app)
                .post('/api/v1/flags')
                .set('Authorization', `Bearer ${ token }`)
                .send({ key: 'dup-flag', name: 'Dup', type: 'boolean' });

            expect(res.status).toBe(409);
        });

        it('인증 없이 요청 → 401', async () => {
            const res = await request(app)
                .post('/api/v1/flags')
                .send({ key: 'no-auth', name: 'No Auth', type: 'boolean' });

            expect(res.status).toBe(401);
        });
    });

    // ============================================================
    // 플래그 목록 조회
    // ============================================================

    describe('GET /api/v1/flags', () => {
        it('플래그 목록 조회 + 페이지네이션', async () => {
            // 플래그 3개 생성
            await createTestFlag(token, { key: 'flag-1', name: 'Flag 1' });
            await createTestFlag(token, { key: 'flag-2', name: 'Flag 2' });
            await createTestFlag(token, { key: 'flag-3', name: 'Flag 3' });

            const res = await request(app)
                .get('/api/v1/flags?page=1&limit=2')
                .set('Authorization', `Bearer ${ token }`);

            expect(res.status).toBe(200);
            expect(res.body.data.items).toHaveLength(2);
            expect(res.body.data.pagination.totalItems).toBe(3);
            expect(res.body.data.pagination.totalPages).toBe(2);
        });

        it('검색 필터링', async () => {
            await createTestFlag(token, { key: 'checkout-flow', name: 'Checkout' });
            await createTestFlag(token, { key: 'dark-mode', name: 'Dark Mode' });

            const res = await request(app)
                .get('/api/v1/flags?search=checkout')
                .set('Authorization', `Bearer ${ token }`);

            expect(res.status).toBe(200);
            expect(res.body.data.items).toHaveLength(1);
            expect(res.body.data.items[0].key).toBe('checkout-flow');
        });
    });

    // ============================================================
    // 플래그 토글
    // ============================================================

    describe('POST /api/v1/flags/:key/toggle', () => {
        it('토글하면 enabled가 반전된다', async () => {
            await createTestFlag(token, { key: 'toggle-test', enabled: false });

            // 첫 번째 토글: false → true
            const res1 = await request(app)
                .post('/api/v1/flags/toggle-test/toggle')
                .set('Authorization', `Bearer ${ token }`);

            expect(res1.status).toBe(200);
            expect(res1.body.data.enabled).toBe(true);

            // 두 번째 토글: true → false
            const res2 = await request(app)
                .post('/api/v1/flags/toggle-test/toggle')
                .set('Authorization', `Bearer ${ token }`);

            expect(res2.body.data.enabled).toBe(false);
        });
    });

    // ============================================================
    // 플래그 삭제 (Soft Delete)
    // ============================================================

    describe('DELETE /api/v1/flags/:key', () => {
        it('삭제 후 조회하면 404', async () => {
            await createTestFlag(token, { key: 'delete-me' });

            // 삭제
            const deleteRes = await request(app)
                .delete('/api/v1/flags/delete-me')
                .set('Authorization', `Bearer ${ token }`);

            expect(deleteRes.status).toBe(204);

            // 삭제 후 조회
            const getRes = await request(app)
                .get('/api/v1/flags/delete-me')
                .set('Authorization', `Bearer ${ token }`);

            expect(getRes.status).toBe(404);
        });
    });
});