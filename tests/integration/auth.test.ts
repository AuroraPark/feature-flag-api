import request from 'supertest';
import app from '../../src/app';
import { setupTestDB, cleanupTestDB, teardownTestDB } from '../setup';
import { beforeAll, beforeEach, describe, afterAll, it } from '@jest/globals';

describe('Auth API', () => {
    // 전체 테스트 시작 전 — DB 초기화
    beforeAll(async () => {
        await setupTestDB();
    });

    // 각 테스트 전 — 데이터 클리어
    beforeEach(async () => {
        await cleanupTestDB();
    });

    // 전체 테스트 후 — DB 연결 종료
    afterAll(async () => {
        await teardownTestDB();
    });

    // ============================================================
    // 회원가입
    // ============================================================

    describe('POST /api/v1/auth/register', () => {
        it('정상 회원가입 → 201 + 사용자 정보 반환', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@test.com',
                    password: 'TestPass123!',
                    name: 'Test User',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.email).toBe('test@test.com');
            expect(res.body.data.name).toBe('Test User');
            // password는 응답에 포함되면 안 됨!
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('중복 이메일 → 409 Conflict', async () => {
            // 첫 번째 가입
            await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'dup@test.com', password: 'Pass123!', name: 'User1' });

            // 같은 이메일로 두 번째 가입
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'dup@test.com', password: 'Pass123!', name: 'User2' });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('필수 필드 누락 → 400 Validation Error', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'test@test.com' }); // password, name 누락

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // ============================================================
    // 로그인
    // ============================================================

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // 로그인 테스트를 위한 유저 먼저 생성
            await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'login@test.com', password: 'Pass123!', name: 'Login User' });
        });

        it('정상 로그인 → 200 + JWT 토큰 반환', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'login@test.com', password: 'Pass123!' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('expiresIn');
            // JWT 형식 확인 (xxx.yyy.zzz)
            expect(res.body.data.accessToken.split('.')).toHaveLength(3);
        });

        it('잘못된 비밀번호 → 401 Unauthorized', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'login@test.com', password: 'WrongPass!' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('존재하지 않는 이메일 → 401 Unauthorized', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'nobody@test.com', password: 'Pass123!' });

            expect(res.status).toBe(401);
        });
    });
});
import { expect } from '@jest/globals';
