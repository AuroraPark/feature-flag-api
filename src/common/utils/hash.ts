import crypto from 'crypto';

/**
 * @param userId   - 외부 서비스의 사용자 ID
 * @param flagKey  - 플래그 고유 키
 * @param percentage - 0~100 사이의 퍼센트 값
 * @returns 해당 유저가 퍼센트 범위에 포함되는지
 */
export function evaluatePercentage(
    userId: string,
    flagKey: string,
    percentage: number
): boolean {
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    const hash = crypto
        .createHash('sha256')
        .update(`${ flagKey }:${ userId }`)
        .digest('hex');

    const bucket = parseInt(hash.substring(0, 8), 16) % 100;

    return bucket < percentage;
}