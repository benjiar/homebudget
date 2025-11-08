import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HouseholdMember, HouseholdRole } from '../../entities';

/**
 * Centralized service for household access validation and permission checking.
 * All household-related permission checks should go through this service.
 */
@Injectable()
export class HouseholdAccessService {
    constructor(
        @InjectRepository(HouseholdMember)
        private householdMembersRepository: Repository<HouseholdMember>,
    ) { }

    /**
     * Check if a user has permission to perform an action on a specific household.
     * Throws ForbiddenException if user doesn't have the required role.
     * 
     * @param householdId - The household ID to check
     * @param userId - The user ID to check
     * @param allowedRoles - Array of roles that are allowed for this operation
     * @throws ForbiddenException if user doesn't have permission
     */
    async checkUserPermission(
        householdId: string,
        userId: string,
        allowedRoles: HouseholdRole[]
    ): Promise<void> {
        const membership = await this.householdMembersRepository.findOne({
            where: {
                user_id: userId,
                household_id: householdId,
                is_active: true,
            },
        });

        if (!membership || !allowedRoles.includes(membership.role)) {
            throw new ForbiddenException('Insufficient permissions for this operation');
        }
    }

    /**
     * Check if a user has permission to perform an action on multiple households.
     * Returns only the household IDs the user has access to with the required roles.
     * 
     * @param householdIds - Array of household IDs to check
     * @param userId - The user ID to check
     * @param allowedRoles - Array of roles that are allowed for this operation
     * @returns Array of household IDs the user has access to
     */
    async filterAccessibleHouseholds(
        householdIds: string[],
        userId: string,
        allowedRoles: HouseholdRole[]
    ): Promise<string[]> {
        if (!householdIds || householdIds.length === 0) {
            return [];
        }

        const memberships = await this.householdMembersRepository.find({
            where: {
                user_id: userId,
                household_id: In(householdIds),
                is_active: true,
            },
        });

        return memberships
            .filter(m => allowedRoles.includes(m.role))
            .map(m => m.household_id);
    }

    /**
     * Get all households a user has access to with specific roles.
     * If no householdIds provided, returns all user's households with the required roles.
     * 
     * @param userId - The user ID
     * @param householdIds - Optional array of household IDs to filter (if empty, returns all)
     * @param allowedRoles - Array of roles that are allowed
     * @returns Array of household IDs the user has access to
     */
    async getUserAccessibleHouseholds(
        userId: string,
        householdIds: string[] = [],
        allowedRoles: HouseholdRole[] = [HouseholdRole.OWNER, HouseholdRole.ADMIN, HouseholdRole.MEMBER]
    ): Promise<string[]> {
        const query: any = {
            user_id: userId,
            is_active: true,
        };

        // If specific household IDs are provided, filter by them
        if (householdIds && householdIds.length > 0) {
            query.household_id = In(householdIds);
        }

        const memberships = await this.householdMembersRepository.find({
            where: query,
        });

        return memberships
            .filter(m => allowedRoles.includes(m.role))
            .map(m => m.household_id);
    }

    /**
     * Check if user is a member of the household (any role).
     * 
     * @param householdId - The household ID to check
     * @param userId - The user ID to check
     * @returns true if user is a member, false otherwise
     */
    async isHouseholdMember(householdId: string, userId: string): Promise<boolean> {
        const membership = await this.householdMembersRepository.findOne({
            where: {
                user_id: userId,
                household_id: householdId,
                is_active: true,
            },
        });

        return !!membership;
    }

    /**
     * Get user's role in a household.
     * 
     * @param householdId - The household ID
     * @param userId - The user ID
     * @returns The user's role or null if not a member
     */
    async getUserRole(householdId: string, userId: string): Promise<HouseholdRole | null> {
        const membership = await this.householdMembersRepository.findOne({
            where: {
                user_id: userId,
                household_id: householdId,
                is_active: true,
            },
        });

        return membership?.role || null;
    }

    /**
     * Validate and return accessible household IDs for read operations.
     * If householdIds is empty, returns all user's households.
     * If householdIds is provided, returns only those the user has access to.
     * 
     * @param householdIds - Array of household IDs from header (can be empty)
     * @param userId - The user ID
     * @returns Array of household IDs the user can access
     */
    async validateAndGetHouseholdIds(
        householdIds: string[],
        userId: string
    ): Promise<string[]> {
        // If no specific households requested, get all user's households
        if (!householdIds || householdIds.length === 0) {
            return this.getUserAccessibleHouseholds(userId);
        }

        // Filter to only households the user has access to
        return this.filterAccessibleHouseholds(
            householdIds,
            userId,
            [HouseholdRole.OWNER, HouseholdRole.ADMIN, HouseholdRole.MEMBER, HouseholdRole.VIEWER]
        );
    }

    /**
     * Check if user can manage (create/update/delete) resources in a household.
     * Only OWNER, ADMIN, and MEMBER can manage resources.
     * 
     * @param householdId - The household ID
     * @param userId - The user ID
     * @throws ForbiddenException if user cannot manage resources
     */
    async checkCanManageResources(householdId: string, userId: string): Promise<void> {
        await this.checkUserPermission(householdId, userId, [
            HouseholdRole.OWNER,
            HouseholdRole.ADMIN,
            HouseholdRole.MEMBER,
        ]);
    }

    /**
     * Check if user can manage household settings.
     * Only OWNER and ADMIN can manage settings.
     * 
     * @param householdId - The household ID
     * @param userId - The user ID
     * @throws ForbiddenException if user cannot manage settings
     */
    async checkCanManageHousehold(householdId: string, userId: string): Promise<void> {
        await this.checkUserPermission(householdId, userId, [
            HouseholdRole.OWNER,
            HouseholdRole.ADMIN,
        ]);
    }

    /**
     * Check if user is household owner.
     * Only OWNER can perform certain operations.
     * 
     * @param householdId - The household ID
     * @param userId - The user ID
     * @throws ForbiddenException if user is not owner
     */
    async checkIsOwner(householdId: string, userId: string): Promise<void> {
        await this.checkUserPermission(householdId, userId, [HouseholdRole.OWNER]);
    }
}
