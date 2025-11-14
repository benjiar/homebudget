import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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

  // Refresh households
  refetch: () => Promise<void>;

  // Deprecated - kept for backwards compatibility
  /** @deprecated Use selectedHouseholdIds instead */
  selectedHouseholds: string[];
  /** @deprecated Use setSelectedHouseholds instead */
  setSelectedHouseholds: (ids: string[]) => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

// In-memory cache to persist across component remounts
let cachedHouseholds: Household[] | null = null;
let cachedUserId: string | null = null;
let fetchPromise: Promise<Household[]> | null = null;

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<string[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasFetchedRef = useRef(false);

  const fetchHouseholds = async (): Promise<Household[]> => {
    const response = await fetch('/api/users/households');

    if (!response.ok) {
      throw new Error('Failed to fetch households');
    }

    const data = await response.json();
    return data;
  };

  const loadHouseholds = async (force = false) => {
    if (!user) {
      setHouseholds([]);
      setSelectedHouseholdIds([]);
      setIsLoading(false);
      cachedHouseholds = null;
      cachedUserId = null;
      hasFetchedRef.current = false;
      return;
    }

    // If user changed, invalidate cache
    if (cachedUserId !== user.id) {
      cachedHouseholds = null;
      cachedUserId = user.id;
      hasFetchedRef.current = false;
    }

    // Return cached data if available and not forcing refresh
    if (cachedHouseholds && !force && hasFetchedRef.current) {
      setHouseholds(cachedHouseholds);
      setIsLoading(false);
      return;
    }

    // If already fetching, reuse the existing promise
    if (fetchPromise) {
      try {
        const data = await fetchPromise;
        setHouseholds(data);
        setIsLoading(false);
        return;
      } catch (err) {
        console.error('HouseholdProvider: failed to load households', err);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);

      // Create a new fetch promise
      fetchPromise = fetchHouseholds();
      const data = await fetchPromise;

      // Cache the results
      cachedHouseholds = data;
      cachedUserId = user.id;
      hasFetchedRef.current = true;

      setHouseholds(data);

      // Default to all households (empty array means "all")
      if (selectedHouseholdIds.length === 0 && data.length > 0) {
        setSelectedHouseholdIds([]);
      }
    } catch (err) {
      console.error('HouseholdProvider: failed to load households', err);
      setHouseholds([]);
    } finally {
      setIsLoading(false);
      fetchPromise = null;
    }
  };

  useEffect(() => {
    loadHouseholds();
  }, [user?.id]);

  // Helper values
  const isAllSelected = selectedHouseholdIds.length === 0;
  const selectAll = () => setSelectedHouseholdIds([]);
  const refetch = () => loadHouseholds(true);

  const value: HouseholdContextType = {
    selectedHouseholdIds,
    setSelectedHouseholdIds,
    households,
    isLoading,
    isAllSelected,
    selectAll,
    refetch,
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

