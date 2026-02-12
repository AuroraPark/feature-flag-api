/**
 * DTO (Data Transfer Object)
 *
 * DB 모델(Flag)의 모든 필드를 클라이언트에 노출하면 안 되므로,
 * 응답용 데이터 형태를 별도 정의.
 */

import Flag from './flag.model';

export interface FlagResponse {
    id: number;
    key: string;
    name: string;
    description: string | null;
    type: 'boolean' | 'percentage' | 'user_target';
    enabled: boolean;
    percentage: number;
    targetUserIds: string[];
    createdBy: {
        id: number;
        name: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Flag 모델 인스턴스를 API 응답 형태로 변환
 *
 * (flag as any).creator → Sequelize include로 가져온 연관 데이터
 * TypeScript가 동적 include를 타입으로 알 수 없으므로 as any 사용
 */
export function toFlagResponse(flag: Flag): FlagResponse {
    const plain = flag.get({ plain: true }) as any;

    return {
        id: plain.id,
        key: plain.key,
        name: plain.name,
        description: plain.description,
        type: plain.type,
        enabled: plain.enabled,
        percentage: plain.percentage,
        targetUserIds: plain.targets
            ? plain.targets.map((t: { userId: string }) => t.userId)
            : [],
        createdBy: plain.creator
            ? { id: plain.creator.id, name: plain.creator.name }
            : { id: plain.createdBy, name: 'Unknown' },
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
    };
}