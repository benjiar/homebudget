interface CachedHouseholds {
  data: any[] | null;
  userId: string | null;
  timestamp: number;
  isLoading: boolean;
}

interface HouseholdsCache {
  get: (userId: string, accessToken: string) => Promise<any[]>;
  getSync: (userId: string) => any[] | null;
  backgroundRefresh: (userId: string, accessToken: string) => Promise<void>;
  invalidate: (userId?: string) => void;
  refresh: (userId: string, accessToken: string) => Promise<any[]>;
  isStale: (userId: string) => boolean;
  hasData: (userId: string) => boolean;
}

// Global cache with 5-minute duration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'homebudget_households_cache_v2';
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

let cache: CachedHouseholds = {
  data: null,
  userId: null,
  timestamp: 0,
  isLoading: false
};

// Track ongoing requests to prevent duplicate calls
const ongoingRequests = new Map<string, Promise<any[]>>();
let lastRequestTime = 0;

// Load initial cache from localStorage
const loadCacheFromStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          cache = { ...parsed, isLoading: false };
          console.log('🏠 Loaded households cache from localStorage');
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load households cache from localStorage:', e);
  }
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: cache.data,
        userId: cache.userId,
        timestamp: cache.timestamp,
        isLoading: false
      }));
    }
  } catch (e) {
    console.warn('Failed to save households cache to localStorage:', e);
  }
};

// Check if cache is stale
const isCacheStale = (userId: string): boolean => {
  if (!cache.data || cache.userId !== userId) {
    return true;
  }
  return Date.now() - cache.timestamp > CACHE_DURATION;
};

// Fetch households from API with throttling
const fetchHouseholds = async (_userId: string, accessToken: string): Promise<any[]> => {
  // Throttle requests to prevent rapid successive calls
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('⏳ Request throttled, waiting...');
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - (now - lastRequestTime)));
  }
  lastRequestTime = Date.now();

  console.log('🔄 Fetching households from API...');
  
  const response = await fetch('/api/users/households', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch households: ${response.status} ${response.statusText}`);
  }

  const userData = await response.json();
  const households = userData.household_memberships?.map((member: any) => member.household) || [];
  
  console.log(`✅ Fetched ${households.length} households from API`);
  return households;
};

// Main cache implementation
export const householdsCache: HouseholdsCache = {
  async get(userId: string, accessToken: string): Promise<any[]> {
    // Return cached data immediately if valid and available
    if (!isCacheStale(userId) && cache.data) {
      console.log(`⚡ Using cached households (${cache.data?.length || 0} items)`);
      return cache.data;
    }

    // If we have ANY cached data for this user, return it immediately to prevent navigation jumps
    // Only fetch new data in background if stale
    if (cache.data && cache.userId === userId) {
      console.log(`📦 Using existing cache during navigation (${cache.data.length} items)`);
      
      // If stale but not already loading, start background refresh
      if (isCacheStale(userId) && !cache.isLoading && !ongoingRequests.size) {
        console.log('🔄 Starting background refresh...');
        // Background refresh without waiting
        this.backgroundRefresh(userId, accessToken);
      }
      
      return cache.data;
    }

    // Check if there's already an ongoing request for this user
    const requestKey = `${userId}:${accessToken.substring(0, 20)}`; // Use partial token to avoid huge keys
    if (ongoingRequests.has(requestKey)) {
      console.log('⏳ Waiting for ongoing households request...');
      return ongoingRequests.get(requestKey)!;
    }

    // Prevent concurrent requests if already loading
    if (cache.isLoading && cache.userId === userId) {
      console.log('⏳ Cache is already loading for this user, waiting...');
      // Wait a bit and return cached data if available
      await new Promise(resolve => setTimeout(resolve, 100));
      return cache.data || [];
    }

    // Mark as loading and create new request
    cache.isLoading = true;
    
    const requestPromise = fetchHouseholds(userId, accessToken)
      .then((households) => {
        // Update cache
        cache = {
          data: households,
          userId,
          timestamp: Date.now(),
          isLoading: false
        };
        
        saveCacheToStorage();
        console.log(`🏠 Cached ${households.length} households for 5 minutes`);
        return households;
      })
      .catch((error) => {
        console.error('❌ Failed to fetch households:', error);
        cache.isLoading = false;
        
        // Return cached data if available, even if stale
        if (cache.data && cache.userId === userId) {
          console.log('📦 Returning stale cached data due to fetch error');
          return cache.data;
        }
        
        throw error;
      })
      .finally(() => {
        // Clean up ongoing request
        ongoingRequests.delete(requestKey);
      });

    // Store the ongoing request
    ongoingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  },

  // Synchronous getter for immediate access during navigation
  getSync(userId: string): any[] | null {
    if (cache.data && cache.userId === userId) {
      return cache.data;
    }
    return null;
  },

  // Background refresh without blocking
  async backgroundRefresh(userId: string, accessToken: string): Promise<void> {
    try {
      const households = await fetchHouseholds(userId, accessToken);
      cache = {
        data: households,
        userId,
        timestamp: Date.now(),
        isLoading: false
      };
      saveCacheToStorage();
      console.log(`🔄 Background refreshed ${households.length} households`);
    } catch (error) {
      console.error('❌ Background refresh failed:', error);
    }
  },

  invalidate(userId?: string): void {
    // Prevent invalidation spam
    if (cache.isLoading) {
      console.log('⚠️ Cache is loading, skipping invalidation');
      return;
    }

    if (userId && cache.userId !== userId) {
      return; // Don't invalidate cache for different user
    }
    
    console.log('🗑️ Invalidating households cache');
    cache = {
      data: null,
      userId: null,
      timestamp: 0,
      isLoading: false
    };
    
    // Clear ongoing requests
    ongoingRequests.clear();
    
    // Remove from localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to remove households cache from localStorage:', e);
    }
  },

  async refresh(userId: string, accessToken: string): Promise<any[]> {
    console.log('🔄 Force refreshing households cache...');
    this.invalidate(userId);
    return this.get(userId, accessToken);
  },

  isStale(userId: string): boolean {
    return isCacheStale(userId);
  },

  hasData(userId: string): boolean {
    return !!cache.data && cache.userId === userId;
  }
};

// Initialize cache on module load
loadCacheFromStorage();

// Export utility functions
export const invalidateHouseholdsCache = (userId?: string) => {
  householdsCache.invalidate(userId);
};

export const refreshHouseholdsCache = (userId: string, accessToken: string) => {
  return householdsCache.refresh(userId, accessToken);
};

export const getHouseholdsFromCache = (userId: string, accessToken: string) => {
  return householdsCache.get(userId, accessToken);
}; 