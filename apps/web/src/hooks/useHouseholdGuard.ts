import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';

interface HouseholdGuardOptions {
  allowGuests?: boolean; // Allow guests to view some pages
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
 * NO LONGER FETCHES DATA OR REDIRECTS - just reads from context and provides validation state
 */
export const useHouseholdGuard = (options: HouseholdGuardOptions = {}): UseHouseholdGuardReturn => {
  const { loading: authLoading } = useAuth();
  const { households, isLoading: isLoadingHouseholds } = useHousehold();

  const { allowGuests = false } = options;

  const isLoading = authLoading || isLoadingHouseholds;
  const hasChecked = !authLoading && !isLoadingHouseholds;

  // NO AUTOMATIC REDIRECTS - Let the component decide what to do
  // The guard only provides the validation state, doesn't force navigation

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