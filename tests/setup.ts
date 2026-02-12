/**
 * 통합 테스트 공통 설정
 *
 * 실제 테스트 DB를 사용하므로:
 * 1. 테스트 시작 전: DB 연결 + 테이블 생성
 * 2. 각 테스트 전: 테이블 데이터 초기화
 * 3. 모든 테스트 후: DB 연결 종료
 */
import sequelize from '../src/config/database';
import redis from '../src/config/redis';
import '../src/database';  // 모델 등록 (연관 관계 초기화)

/**
 * 모든 테스트 시작 전 — DB sync
 *
 * force: true = 테이블을 DROP하고 다시 CREATE
 * → 깨끗한 상태에서 테스트 시작
 */
export async function setupTestDB(): Promise<void> {
    await sequelize.sync({ force: true }); // 테스트 DB용
}

/**
 * 모든 테이블의 데이터를 삭제 (테이블 구조는 유지)
 *
 * 각 테스트 파일의 beforeEach에서 호출하여
 * 테스트 간 데이터 격리를 보장
 */
export async function cleanupTestDB(): Promise<void> {
    // 외래키 제약 때문에 삭제 순서가 중요!
    // 자식 테이블 → 부모 테이블 순서로 삭제
    const models = sequelize.models;

    // 외래키 검사 일시 비활성화 (순서 문제 해결)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const modelName of Object.keys(models)) {
        await models[modelName].destroy({
            where: {},
            force: true,      // paranoid 모델도 완전 삭제
            truncate: true,    // AUTO_INCREMENT 리셋
        });
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * DB + Redis 연결 종료
 */
export async function teardownTestDB(): Promise<void> {
    await sequelize.close();
    await redis.quit();
}

/**
 * Redis 캐시 전체 삭제
 */
export async function flushRedis(): Promise<void> {
    try {
        await redis.flushdb();
    } catch (error) {
        // Redis가 없어도 테스트는 계속
        console.warn('[Test] Redis flush failed:', error);
    }
}