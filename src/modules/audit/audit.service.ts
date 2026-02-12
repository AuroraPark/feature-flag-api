import auditRepository from './audit.repository';
import flagRepository from '../flag/flag.repository';
import { NotFoundError } from '../../common/errors';
import { PaginatedResult } from '../../common/types';


interface AuditLogResponse {
    id: number;
    action: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';
    changedBy: {
        id: number;
        name: string;
    };
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    createdAt: Date;
}

function toAuditResponse(log: any): AuditLogResponse {
    const plain = log.get ? log.get({ plain: true }) : log;

    return {
        id: plain.id,
        action: plain.action,
        changedBy: plain.changer
            ? { id: plain.changer.id, name: plain.changer.name }
            : { id: plain.changedBy, name: 'Unknown' },
        before: plain.before,
        after: plain.after,
        createdAt: plain.createdAt,
    };
}

class AuditService {

    async log(data: {
        flagId: number;
        action: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';
        changedBy: number;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
    }): Promise<void> {
        await auditRepository.create(data);
    }

    async findByFlagKey(
        flagKey: string,
        params: { page: number; limit: number }
    ): Promise<PaginatedResult<AuditLogResponse>> {
        const flag = await flagRepository.findByKeyIncludeDeleted(flagKey);
        if (!flag) {
            throw new NotFoundError('Flag', flagKey);
        }

        const { rows, count } = await auditRepository.findByFlagId(flag.id, params);

        return {
            items: rows.map(toAuditResponse),
            pagination: {
                page: params.page,
                limit: params.limit,
                totalItems: count,
                totalPages: Math.ceil(count / params.limit),
            },
        };
    }

    /**
     * 전체 감사 로그 조회
     */
    async findAll(
        params: { page: number; limit: number }
    ): Promise<PaginatedResult<AuditLogResponse>> {
        const { rows, count } = await auditRepository.findAll(params);

        return {
            items: rows.map(toAuditResponse),
            pagination: {
                page: params.page,
                limit: params.limit,
                totalItems: count,
                totalPages: Math.ceil(count / params.limit),
            },
        };
    }
}

export default new AuditService();