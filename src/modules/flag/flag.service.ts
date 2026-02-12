import evaluateService from '../evaluate/evaluate.service';
import flagRepository from './flag.repository';
import { toFlagResponse, FlagResponse } from './flag.dto';
import { NotFoundError, ConflictError } from '../../common/errors';
import { PaginatedResult } from '../../common/types';

class FlagService {
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
        targetUserIds?: string[];
        createdBy: number;     // authGuard에서 넣어준 user.id
    }): Promise<any> {
        // 1. key 중복 확인
        const existing = await flagRepository.findByKey(data.key);
        if (existing) {
            throw new ConflictError('flag', 'key');
        }

        // 2. 플래그 생성 (targetUserIds는 별도 처리)
        const { targetUserIds, ...flagData } = data;
        const flag = await flagRepository.create(flagData);

        // 3. user_target 타입이면 타깃 유저 설정
        if (data.type === 'user_target' && targetUserIds && targetUserIds.length > 0) {
            await flagRepository.setTargets(flag.id, targetUserIds);
        }

        // 4. 연관 데이터 포함해서 다시 조회
        const fullFlag = await flagRepository.findByKey(flag.key);

        // TODO: Audit Log 기록 (다음 단계에서 추가)
        // await auditService.log({ flagId: flag.id, action: 'CREATE', ... });


        return toFlagResponse(fullFlag!);
    }

    /**
     * 플래그 목록 조회 (페이지네이션)
     */
    async findAll(params: {
        page: number;
        limit: number;
        search?: string;
        type?: string;
    }): Promise<PaginatedResult<FlagResponse>> {
        const { page, limit } = params;
        const { rows, count } = await flagRepository.findAll(params);

        return {
            data: rows.map(toFlagResponse),
            pagination: {
                page,
                limit,
                totalItems: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    /**
     * 플래그 상세 조회
     */
    async findByKey(key: string): Promise<FlagResponse> {
        const flag = await flagRepository.findByKey(key);
        if (!flag) {
            throw new NotFoundError('Flag', key);
        }
        return toFlagResponse(flag);
    }

    /**
     * 플래그 수정 (부분 수정 지원)
     */
    async update(
        key: string,
        data: {
            name?: string;
            description?: string;
            enabled?: boolean;
            percentage?: number;
            targetUserIds?: string[];
        },
        userId: number          // 감사 로그용 (누가 수정했는지)
    ): Promise<FlagResponse> {
        // 1. 존재 확인
        const existing = await flagRepository.findByKey(key);
        if (!existing) {
            throw new NotFoundError('Flag', key);
        }


        // TODO: Audit Log — before 스냅샷 저장
        // const before = toFlagResponse(existing);

        // 2. 타깃 유저 업데이트 (별도 처리)
        const { targetUserIds, ...flagData } = data;
        if (targetUserIds !== undefined) {
            await flagRepository.setTargets(existing.id, targetUserIds);
        }

        // 3. 나머지 필드 업데이트
        if (Object.keys(flagData).length > 0) {
            await flagRepository.update(key, flagData);
        }

        // 4. 최신 데이터 반환
        const updated = await flagRepository.findByKey(key);

        // TODO: Audit Log — after 스냅샷과 함께 기록
        // await auditService.log({ flagId: existing.id, action: 'UPDATE', before, after, changedBy: userId });
        await evaluateService.invalidateCache(key);

        return toFlagResponse(updated!);
    }

    /**
     * 플래그 토글 (활성/비활성 전환)
     */
    async toggle(key: string, userId: number): Promise<{ key: string; enabled: boolean; toggledAt: string }> {
        const existing = await flagRepository.findByKey(key);
        if (!existing) {
            throw new NotFoundError('Flag', key);
        }

        // TODO: Audit Log — TOGGLE 액션 기록
        await evaluateService.invalidateCache(key);

        const toggled = await flagRepository.toggle(key);

        return {
            key: toggled!.key,
            enabled: toggled!.enabled,
            toggledAt: new Date().toISOString(),
        };
    }

    /**
     * 플래그 삭제 (soft delete)
     */
    async delete(key: string, userId: number): Promise<void> {
        const existing = await flagRepository.findByKey(key);
        if (!existing) {
            throw new NotFoundError('Flag', key);
        }

        // TODO: Audit Log — DELETE 액션 기록
        await evaluateService.invalidateCache(key);

        await flagRepository.softDelete(key);
    }
}

export default new FlagService();