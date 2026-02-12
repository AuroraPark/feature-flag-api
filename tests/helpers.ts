/**
 * 통합 테스트에서 반복되는 작업을 헬퍼로 추출
 *
 * 예: 거의 모든 API 테스트에서 "회원가입 → 로그인 → 토큰 획득" 필요
 */
import request from 'supertest';
import app from '../src/app';

/**
 * 테스트용 유저 생성 + 로그인하여 JWT 토큰 반환
 *
 * 대부분의 통합 테스트가 인증이 필요하므로 이 헬퍼를 자주 사용
 */
export async function createUserAndGetToken(userData?: {
    email?: string;
    password?: string;
    name?: string;
}): Promise<{ token: string; apiKey: string; userId: number }> {
    const email = userData?.email || `test-${ Date.now() }@test.com`;
    const password = userData?.password || 'TestPass123!';
    const name = userData?.name || 'Test User';

    // 1. 회원가입
    const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password, name });

    // 2. 로그인
    const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

    return {
        token: loginRes.body.data.accessToken,
        apiKey: registerRes.body.data.apiKey || '',
        userId: registerRes.body.data.id,
    };
}

/**
 * 테스트용 플래그 생성
 *
 * Evaluate 통합 테스트에서 플래그가 미리 있어야 하므로
 */
export async function createTestFlag(
    token: string,
    flagData?: Partial<{
        key: string;
        name: string;
        type: string;
        enabled: boolean;
        percentage: number;
        targetUserIds: string[];
    }>
): Promise<any> {
    const defaultData = {
        key: `test-flag-${ Date.now() }`,
        name: 'Test Flag',
        type: 'boolean',
        enabled: false,
        ...flagData,
    };

    // percentage 타입이면 percentage 값 필요
    if (defaultData.type === 'percentage' && defaultData.percentage === undefined) {
        defaultData.percentage = 50;
    }

    // user_target 타입이면 targetUserIds 필요
    if (defaultData.type === 'user_target' && !defaultData.targetUserIds) {
        defaultData.targetUserIds = ['user_1', 'user_2'];
    }

    const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${ token }`)
        .send(defaultData);

    return res.body.data;
}