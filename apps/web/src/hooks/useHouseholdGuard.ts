import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { householdsCache, invalidateHouseholdsCache } from '@/lib/householdsCache';

interface HouseholdGuardOptions {
  redirectTo?: string;
  allowGuests?: boolean; // Allow guests to view some pages
  showNoHouseholdModal?: boolean;
}

interface UseHouseholdGuardReturn {
  hasHouseholds: boolean;
  households: any[];
  isLoading: boolean;
  isHouseholdGuardEnabled: boolean;
  currentHousehold: any | null;
  hasChecked: boolean;
}

export const useHouseholdGuard = (options: HouseholdGuardOptions = {}): UseHouseholdGuardReturn => {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [households, setHouseholds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const {
    redirectTo = '/households',
    allowGuests = false,
    showNoHouseholdModal = false
  } = options;

  // Initialize with synchronous cache data immediately to prevent navigation jumps
  useEffect(() => {
    if (user && !authLoading) {
      const syncData = householdsCache.getSync(user.id);
      if (syncData && syncData.length > 0) {
        console.log(`⚡ GUARD: Using sync cache (${syncData.length} households)`);
        setHouseholds(syncData);
        setIsLoading(false);
        setHasChecked(true);
        return;
      }
    }
  }, [user, authLoading]);

  // Load households when auth is ready and we don't have sync data
  useEffect(() => {
    if (!user || authLoading) {
      // Clear state when no user or still loading auth
      setHouseholds([]);
      setIsLoading(true);
      setHasChecked(false);
      return;
    }

    // Skip if we already have data from sync cache
    if (hasChecked && households.length > 0) {
      return;
    }

    // Skip if we already have sync data
    const syncData = householdsCache.getSync(user.id);
    if (syncData) {
      setHouseholds(syncData);
      setIsLoading(false);
      setHasChecked(true);
      return;
    }

    const loadHouseholds = async () => {
      try {
        setIsLoading(true);
        const accessToken = getAccessToken();
        
        if (!accessToken) {
          console.warn('GUARD: No access token available');
          setHouseholds([]);
          setHasChecked(true);
          setIsLoading(false);
          return;
        }

        const cachedHouseholds = await householdsCache.get(user.id, accessToken);
        setHouseholds(cachedHouseholds);
        setHasChecked(true);
        console.log(`🏠 GUARD: Loaded ${cachedHouseholds.length} households`);
      } catch (error) {
        console.error('GUARD: Failed to load households:', error);
        setHouseholds([]);
        setHasChecked(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load if we don't have any cached data
    if (!householdsCache.hasData(user.id)) {
      loadHouseholds();
    }
  }, [user, authLoading, hasChecked, households.length]);

  // Handle redirects - only when all conditions are met
  useEffect(() => {
    if (!user || authLoading || !hasChecked || isLoading) {
      return;
    }

    // Redirect when no households and not allowing guests
    if (households.length === 0 && !allowGuests && !showNoHouseholdModal) {
      console.log('🔄 GUARD: Redirecting to households page (no households found)');
      router.push(redirectTo);
    }
  }, [hasChecked, authLoading, user, households.length, allowGuests, showNoHouseholdModal, redirectTo, router, isLoading]);

  // Get current household from localStorage or first household
  const getCurrentHousehold = () => {
    if (households.length === 0) return null;
    
    const currentHouseholdId = localStorage.getItem('currentHouseholdId');
    if (currentHouseholdId) {
      const found = households.find(h => h.id === currentHouseholdId);
      if (found) return found;
    }
    
    return households[0];
  };

  return {
    hasHouseholds: households.length > 0,
    households,
    isLoading: isLoading || authLoading,
    isHouseholdGuardEnabled: !allowGuests,
    currentHousehold: getCurrentHousehold(),
    hasChecked,
  };
};

// Route-level household requirement levels
export enum HouseholdRequirement {
  REQUIRED = 'required',        // Must have household, redirect if not
  OPTIONAL = 'optional',        // Can work without household, show empty states
  GUEST_ALLOWED = 'guest_allowed' // Guests can view (like public landing)
}

// Hook for specific route protection
export const useRouteHouseholdGuard = (requirement: HouseholdRequirement = HouseholdRequirement.REQUIRED) => {
  const guardData = useHouseholdGuard({
    allowGuests: requirement === HouseholdRequirement.GUEST_ALLOWED,
    showNoHouseholdModal: requirement === HouseholdRequirement.OPTIONAL,
  });

  const shouldRedirect = requirement === HouseholdRequirement.REQUIRED && 
                         !guardData.hasHouseholds && 
                         !guardData.isLoading && 
                         guardData.hasChecked;

  return {
    ...guardData,
    isRouteAccessible: requirement === HouseholdRequirement.GUEST_ALLOWED || 
                      requirement === HouseholdRequirement.OPTIONAL || 
                      guardData.hasHouseholds,
    shouldShowEmptyState: requirement === HouseholdRequirement.OPTIONAL && !guardData.hasHouseholds,
    shouldRedirect,
  };
};

// Legacy functions for backward compatibility (now use the new cache system)
export const getCachedHouseholdsSync = (_userId?: string): any[] => {
  console.warn('getCachedHouseholdsSync is deprecated. Use householdsCache.get() instead.');
  return [];
};

export const hasCachedHouseholds = (userId?: string): boolean => {
  if (!userId) return false;
  return !householdsCache.isStale(userId);
};

// Simple hook for getting households synchronously (no loading states)
export const useHouseholdsSync = () => {
  const { user } = useAuth();
  
  if (!user) {
    return [];
  }
  
  return householdsCache.getSync(user.id) || [];
};

// Re-export cache functions for convenience
export { invalidateHouseholdsCache, householdsCache }; 