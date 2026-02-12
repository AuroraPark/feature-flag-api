import flagRepository from './flag.repository';
import evaluateService from '../evaluate/evaluate.service';
import auditService from '../audit/audit.service';
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
        createdBy: number;
    }): Promise<FlagResponse> {
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
        const response = toFlagResponse(fullFlag!);

        // Audit Log 기록 
        try {
            await auditService.log({
                flagId: flag.id,
                action: 'CREATE',
                changedBy: data.createdBy,
                before: null,                          // 생성이므로 이전 상태 없음
                after: {                               // 생성된 데이터의 핵심 필드만 기록
                    key: response.key,
                    name: response.name,
                    type: response.type,
                    enabled: response.enabled,
                    percentage: response.percentage,
                    targetUserIds: response.targetUserIds,
                },
            });
        } catch (error) {
            // 감사 로그 실패가 플래그 생성을 막으면 안 됨 → 로깅만
            console.error('[Audit] Failed to log CREATE:', error);
        }

        return response;
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
        userId: number
    ): Promise<FlagResponse> {
        // 1. 존재 확인
        const existing = await flagRepository.findByKey(key);
        if (!existing) {
            throw new NotFoundError('Flag', key);
        }


        // Audit Log — before 스냅샷 저장
        const beforeSnapshot = {
            name: existing.name,
            description: existing.description,
            enabled: existing.enabled,
            percentage: existing.percentage,
            targetUserIds: (existing as any).targets
                ? (existing as any).targets.map((t: any) => t.userId)
                : [],
        };

        // 2. 타깃 유저 업데이트 
        const { targetUserIds, ...flagData } = data;
        if (targetUserIds !== undefined) {
            await flagRepository.setTargets(existing.id, targetUserIds);
        }

        // 3. 나머지 필드 업데이트
        if (Object.keys(flagData).length > 0) {
            await flagRepository.update(key, flagData);
        }

        // 4. 캐시 무효화
        await evaluateService.invalidateCache(key);

        // 5. 최신 데이터 반환
        const updated = await flagRepository.findByKey(key);
        const response = toFlagResponse(updated!);

        // Audit Log — after 스냅샷과 함께 기록
        try {
            const afterSnapshot: Record<string, unknown> = {};
            if (data.name !== undefined) afterSnapshot.name = data.name;
            if (data.description !== undefined) afterSnapshot.description = data.description;
            if (data.enabled !== undefined) afterSnapshot.enabled = data.enabled;
            if (data.percentage !== undefined) afterSnapshot.percentage = data.percentage;
            if (data.targetUserIds !== undefined) afterSnapshot.targetUserIds = data.targetUserIds;

            await auditService.log({
                flagId: existing.id,
                action: 'UPDATE',
                changedBy: userId,
                before: beforeSnapshot,
                after: afterSnapshot,
            });
        } catch (error) {
            console.error('[Audit] Failed to log UPDATE:', error);
        }

        return response;
    }

    /**
     * 플래그 토글 (활성/비활성 전환)
     */
    async toggle(key: string, userId: number): Promise<{ key: string; enabled: boolean; toggledAt: string }> {
        const existing = await flagRepository.findByKey(key);
        if (!existing) {
            throw new NotFoundError('Flag', key);
        }

        const beforeEnabled = existing.enabled;
        const toggled = await flagRepository.toggle(key);

        await evaluateService.invalidateCache(key);

        try {
            await auditService.log({
                flagId: existing.id,
                action: 'TOGGLE',
                changedBy: userId,
                before: { enabled: beforeEnabled },
                after: { enabled: toggled!.enabled },
            });
        } catch (error) {
            console.error('[Audit] Failed to log TOGGLE:', error);
        }

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

        const beforeSnapshot = toFlagResponse(existing);

        await flagRepository.softDelete(key);

        await evaluateService.invalidateCache(key);

        try {
            await auditService.log({
                flagId: existing.id,
                action: 'DELETE',
                changedBy: userId,
                before: {
                    key: beforeSnapshot.key,
                    name: beforeSnapshot.name,
                    type: beforeSnapshot.type,
                    enabled: beforeSnapshot.enabled,
                    percentage: beforeSnapshot.percentage,
                    targetUserIds: beforeSnapshot.targetUserIds,
                },
                after: null,
            });
        } catch (error) {
            console.error('[Audit] Failed to log DELETE:', error);
        }
    }
}

export default new FlagService();