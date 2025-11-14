import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { Household } from '../entities/household.entity';

/**
 * Cache service for household data using LRU (Least Recently Used) caching strategy.
 * 
 * This service maintains a mapping of userId -> households[] to optimize database queries.
 * For small family/friends applications, we cap at 100 users which provides excellent
 * performance while keeping memory usage reasonable (~1-5MB depending on household data).
 * 
 * Features:
 * - Lazy population: Cache is populated on first access
 * - Automatic eviction: Least recently used entries are removed when cache is full
 * - TTL: Entries expire after 15 minutes to prevent stale data
 * - Selective invalidation: Individual user caches can be cleared on updates
 */
@Injectable()
export class HouseholdCacheService {
    private readonly logger = new Logger(HouseholdCacheService.name);
    private cache: LRUCache<string, Household[]>;

    constructor() {
        // Best practices for small application (friends & family):
        // - max: 100 users - reasonable for family/friends app, prevents unbounded growth
        // - ttl: 15 minutes - balances freshness with performance
        // - updateAgeOnGet: true - keeps frequently accessed data in cache longer
        // - allowStale: false - ensures we never serve outdated data
        this.cache = new LRUCache<string, Household[]>({
            max: 100, // Maximum number of users to cache
            ttl: 1000 * 60 * 15, // 15 minutes Time To Live
            updateAgeOnGet: true, // Reset TTL on access (keeps hot data fresh)
            allowStale: false, // Never return stale data
        });

        this.logger.log('Household cache initialized with max 100 users, 15min TTL');
    }

    /**
     * Get households for a user from cache
     * @param userId - The user ID to lookup
     * @returns Cached households array or undefined if not in cache
     */
    get(userId: string): Household[] | undefined {
        const cached = this.cache.get(userId);
        if (cached) {
            this.logger.debug(`Cache hit for user ${userId}`);
        } else {
            this.logger.debug(`Cache miss for user ${userId}`);
        }
        return cached;
    }

    /**
     * Store households for a user in cache
     * @param userId - The user ID
     * @param households - Array of households to cache
     */
    set(userId: string, households: Household[]): void {
        this.cache.set(userId, households);
        this.logger.debug(`Cached ${households.length} households for user ${userId}`);
    }

    /**
     * Invalidate cache for a specific user
     * Use when a user's household membership changes
     * @param userId - The user ID to invalidate
     */
    invalidateUser(userId: string): void {
        const deleted = this.cache.delete(userId);
        if (deleted) {
            this.logger.debug(`Invalidated cache for user ${userId}`);
        }
    }

    /**
     * Invalidate cache for all members of a household
     * Use when household data changes (name, settings, etc.)
     * @param household - The household entity with members loaded
     */
    invalidateHousehold(household: Household): void {
        if (!household.members || household.members.length === 0) {
            this.logger.debug(`No members to invalidate for household ${household.id}`);
            return;
        }

        const memberIds = household.members.map(m => m.user_id);
        let invalidatedCount = 0;

        for (const userId of memberIds) {
            if (this.cache.delete(userId)) {
                invalidatedCount++;
            }
        }

        this.logger.debug(
            `Invalidated cache for ${invalidatedCount}/${memberIds.length} members of household ${household.id}`
        );
    }

    /**
     * Invalidate cache for multiple users
     * Useful for bulk operations
     * @param userIds - Array of user IDs to invalidate
     */
    invalidateUsers(userIds: string[]): void {
        let invalidatedCount = 0;

        for (const userId of userIds) {
            if (this.cache.delete(userId)) {
                invalidatedCount++;
            }
        }

        this.logger.debug(`Invalidated cache for ${invalidatedCount}/${userIds.length} users`);
    }

    /**
     * Clear the entire cache
     * Use sparingly, typically only for maintenance or testing
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.logger.log(`Cleared entire cache (${size} entries removed)`);
    }

    /**
     * Get cache statistics for monitoring
     */
    getStats(): { size: number; maxSize: number; hitRate: string } {
        return {
            size: this.cache.size,
            maxSize: 100,
            hitRate: 'N/A', // LRU cache v11 doesn't track hit rate by default
        };
    }
}
