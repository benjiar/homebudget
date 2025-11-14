import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';

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

/**
 * Hook for household-based route protection
 * Uses HouseholdContext as single source of truth for household data
 * NO LONGER FETCHES DATA - just reads from context and handles redirects
 */
export const useHouseholdGuard = (options: HouseholdGuardOptions = {}): UseHouseholdGuardReturn => {
  const { user, loading: authLoading } = useAuth();
  const { households, isLoading: isLoadingHouseholds } = useHousehold();
  const router = useRouter();

  const {
    redirectTo = '/households',
    allowGuests = false,
    showNoHouseholdModal = false
  } = options;

  const isLoading = authLoading || isLoadingHouseholds;
  const hasChecked = !authLoading && !isLoadingHouseholds;

  // Handle redirects - only when all conditions are met
  useEffect(() => {
    if (!user || !hasChecked || isLoading) {
      return;
    }

    // Redirect when no households and not allowing guests
    if (households.length === 0 && !allowGuests && !showNoHouseholdModal) {
      console.log('🔄 GUARD: Redirecting to households page (no households found)');
      router.push(redirectTo);
    }
  }, [hasChecked, user, households.length, allowGuests, showNoHouseholdModal, redirectTo, router, isLoading]);

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

// Legacy functions for backward compatibility
export const getCachedHouseholdsSync = (_userId?: string): any[] => {
  console.warn('getCachedHouseholdsSync is deprecated. Use HouseholdContext instead.');
  return [];
};

export const hasCachedHouseholds = (_userId?: string): boolean => {
  console.warn('hasCachedHouseholds is deprecated. Use HouseholdContext instead.');
  return false;
}; 