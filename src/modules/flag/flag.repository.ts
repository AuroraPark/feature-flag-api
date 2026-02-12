import { Op } from 'sequelize';
import Flag from './flag.model';
import FlagTarget from './flag-target.model';
import User from '../auth/auth.model';
import { PaginationParams } from '../../common/types';

/**
 * 플래그 조회 시 공통으로 포함할 연관 데이터 설정
 *
 * Sequelize의 include = SQL의 JOIN과 비슷
 * → Flag를 조회할 때 creator(User)와 targets(FlagTarget)도 함께 가져옴
 */
const FLAG_INCLUDE = [
    {
        model: User,
        as: 'creator',                              // Flag.belongsTo에서 정의한 alias
        attributes: ['id', 'name'],                 // password 등은 제외하고 id, name만
    },
    {
        model: FlagTarget,
        as: 'targets',                              // Flag.hasMany에서 정의한 alias
        attributes: ['userId'],                     // 타깃 유저 ID만
    },
];

interface FindAllParams extends PaginationParams {
    search?: string;
    type?: string;
}

class FlagRepository {
    /**
     * 플래그 생성
     */
    async create(data: {
        key: string;
        name: string;
        description?: string;
        type: 'boolean' | 'percentage' | 'user_target';
        enabled?: boolean;
        percentage?: number;
        createdBy: number;
    }): Promise<Flag> {
        return Flag.create(data);
    }

    /**
     * 플래그 목록 조회 (페이지네이션 + 검색 + 필터)
     *
     * findAndCountAll = findAll + count를 한번에
     * → { rows: Flag[], count: number } 반환
     */
    async findAll(params: FindAllParams): Promise<{ rows: Flag[]; count: number }> {
        const { page, limit, search, type } = params;
        const offset = (page - 1) * limit;

        // where 조건을 동적으로 구성
        const where: Record<string, unknown> = {};

        if (search) {
            // key 또는 name에 검색어 포함
            where[Op.or as unknown as string] = [
                { key: { [Op.like]: `%${ search }%` } },
                { name: { [Op.like]: `%${ search }%` } },
            ];
        }

        if (type) {
            where.type = type;
        }

        return Flag.findAndCountAll({
            where,
            include: FLAG_INCLUDE,
            limit,
            offset,
            order: [['createdAt', 'DESC']],        // 최신순 정렬
            distinct: true,                          // include 사용 시 count 정확도 보장
        });
    }

    /**
     * 플래그 단건 조회 (key로)
     */
    async findByKey(key: string): Promise<Flag | null> {
        return Flag.findOne({
            where: { key },
            include: FLAG_INCLUDE,
        });
    }

    /**
     * 플래그 수정
     *
     * update()는 [affectedCount] 반환 → 수정된 행 수
     * 수정 후 최신 데이터를 다시 조회해서 반환
     */
    async update(key: string, data: Partial<{
        name: string;
        description: string;
        enabled: boolean;
        percentage: number;
    }>): Promise<Flag | null> {
        await Flag.update(data, { where: { key } });
        return this.findByKey(key);
    }

    /**
     * 플래그 토글 (enabled 반전)
     *
     * Sequelize의 sequelize.literal = 날 SQL 표현식
     * → SET enabled = NOT enabled (DB에서 직접 반전, race condition 방지)
     */
    async toggle(key: string): Promise<Flag | null> {
        const flag = await Flag.findOne({ where: { key } });
        if (!flag) return null;

        flag.enabled = !flag.enabled;
        await flag.save();
        return this.findByKey(key);
    }

    /**
     * 플래그 삭제 (soft delete)
     *
     * paranoid: true이므로 destroy()는 실제 삭제 안 하고
     * deleted_at에 현재 시간을 기록
     */
    async softDelete(key: string): Promise<boolean> {
        const deleted = await Flag.destroy({ where: { key } });
        return deleted > 0;
    }

    /**
     * 타깃 유저 목록을 벌크 설정
     *
     * 기존 타깃을 전부 삭제하고 새로 넣는 전략 (replace)
     * → 부분 추가/삭제보다 구현이 단순하고 결과가 예측 가능
     */
    async setTargets(flagId: number, userIds: string[]): Promise<void> {
        // 기존 타깃 삭제
        await FlagTarget.destroy({ where: { flagId } });

        // 새 타깃 벌크 생성
        if (userIds.length > 0) {
            const targets = userIds.map((userId) => ({ flagId, userId }));
            await FlagTarget.bulkCreate(targets);
        }
    }

    /**
     * 삭제된 플래그 포함 조회
     *
     * Audit 로그 조회 시 사용 — 삭제된 플래그의 감사 기록도 확인해야 하므로.
     * paranoid: false → WHERE deleted_at IS NULL 조건을 무시
     */
    async findByKeyIncludeDeleted(key: string): Promise<Flag | null> {
        return Flag.findOne({
            where: { key },
            paranoid: false,    // ★ soft delete된 레코드도 조회
        });
    }
}

export default new FlagRepository();