import AuditLog from './audit.model';
import User from '../auth/auth.model';
import Flag from '../flag/flag.model';
import { PaginationParams } from '../../common/types';

/**
 * AuditLog 조회 시 공통 include 설정
 */
const AUDIT_INCLUDE = [
    {
        model: User,
        as: 'changer',
        attributes: ['id', 'name'],
    },
    {
        model: Flag,
        as: 'flag',
        attributes: ['key', 'name'],
        paranoid: false,
    },
];

class AuditRepository {
    /**
     * 감사 로그 생성
     */
    async create(data: {
        flagId: number;
        action: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';
        changedBy: number;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
    }): Promise<AuditLog> {
        return AuditLog.create({
            flagId: data.flagId,
            action: data.action,
            changedBy: data.changedBy,
            before: data.before ?? null,
            after: data.after ?? null,
        });
    }

    /**
     * 특정 플래그의 감사 로그 조회 (페이지네이션)
     */
    async findByFlagId(
        flagId: number,
        params: PaginationParams
    ): Promise<{ rows: AuditLog[]; count: number }> {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        return AuditLog.findAndCountAll({
            where: { flagId },
            include: AUDIT_INCLUDE,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });
    }

    /**
     * 전체 감사 로그 조회 (페이지네이션)
     */
    async findAll(
        params: PaginationParams
    ): Promise<{ rows: AuditLog[]; count: number }> {
        const { page, limit } = params;
        const offset = (page - 1) * limit;

        return AuditLog.findAndCountAll({
            include: AUDIT_INCLUDE,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true,
        });
    }
}

export default new AuditRepository();