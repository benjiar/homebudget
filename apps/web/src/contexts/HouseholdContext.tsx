import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getCachedHouseholdsSync, hasCachedHouseholds } from '@/hooks/useHouseholdGuard';

export interface Household {
  id: string;
  name: string;
}

interface HouseholdContextType {
  // Selected household IDs (empty array = all households)
  selectedHouseholdIds: string[];
  setSelectedHouseholdIds: (ids: string[]) => void;

  // All available households for the user
  households: Household[];
  isLoading: boolean;

  // Helper to check if "all" is selected
  isAllSelected: boolean;

  // Toggle all selection
  selectAll: () => void;

  // Deprecated - kept for backwards compatibility
  /** @deprecated Use selectedHouseholdIds instead */
  selectedHouseholds: string[];
  /** @deprecated Use setSelectedHouseholdIds instead */
  setSelectedHouseholds: (ids: string[]) => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<string[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load households from cache (or later from API)
    const load = () => {
      try {
        if (user && hasCachedHouseholds(user.id)) {
          const cached = getCachedHouseholdsSync(user.id);
          setHouseholds(cached);
          // Default to all households (empty array)
          if (selectedHouseholdIds.length === 0) {
            setSelectedHouseholdIds([]);
          }
        } else {
          setHouseholds([]);
        }
      } catch (err) {
        // ignore - keep households empty
        console.error('HouseholdProvider: failed to load cached households', err);
        setHouseholds([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) load();
    else {
      // if no user, ensure state is reset
      setHouseholds([]);
      setSelectedHouseholdIds([]);
      setIsLoading(false);
    }
  }, [user]);

  // Helper values
  const isAllSelected = selectedHouseholdIds.length === 0;
  const selectAll = () => setSelectedHouseholdIds([]);

  const value: HouseholdContextType = {
    selectedHouseholdIds,
    setSelectedHouseholdIds,
    households,
    isLoading,
    isAllSelected,
    selectAll,
    // Backwards compatibility
    selectedHouseholds: selectedHouseholdIds,
    setSelectedHouseholds: setSelectedHouseholdIds,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}

