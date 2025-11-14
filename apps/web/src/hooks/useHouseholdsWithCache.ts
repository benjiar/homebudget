import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiClient } from './useApiClient';
import { useHousehold } from '../contexts/HouseholdContext';
import { Household } from '@homebudget/types';

interface UseHouseholdsWithCacheReturn {
  households: Household[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createHousehold: (data: any) => Promise<Household>;
  leaveHousehold: (householdId: string) => Promise<void>;
  updateHousehold: (householdId: string, data: any) => Promise<Household>;
  deleteHousehold: (householdId: string) => Promise<void>;
}

// Module-level cache to persist across component remounts and prevent duplicate fetches
let cachedDetailedHouseholds: Household[] | null = null;
let cachedUserId: string | null = null;
let fetchPromise: Promise<Household[]> | null = null;

/**
 * Hook for managing households with detailed information
 * First reads from HouseholdContext (shared cache), then fetches detailed data only if needed
 * Uses module-level cache to prevent duplicate API calls
 */
export const useHouseholdsWithCache = (): UseHouseholdsWithCacheReturn => {
  const { user } = useAuth();
  const client = useApiClient();
  const { isLoading: contextLoading, refetch: refetchContext } = useHousehold();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedDetailsRef = useRef(false);

  const fetchDetailedHouseholds = useCallback(async (force = false) => {
    if (!user) {
      setHouseholds([]);
      setIsLoading(false);
      cachedDetailedHouseholds = null;
      cachedUserId = null;
      hasFetchedDetailsRef.current = false;
      return;
    }

    // If user changed, invalidate cache
    if (cachedUserId !== user.id) {
      cachedDetailedHouseholds = null;
      cachedUserId = user.id;
      hasFetchedDetailsRef.current = false;
    }

    // Return cached detailed data if available and not forcing refresh
    if (cachedDetailedHouseholds && !force && hasFetchedDetailsRef.current) {
      setHouseholds(cachedDetailedHouseholds);
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to load households';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a shared promise for concurrent calls
      fetchPromise = client.get<Household[]>('/households');
      const data = await fetchPromise;

      // Update cache
      cachedDetailedHouseholds = data;
      cachedUserId = user.id;
      hasFetchedDetailsRef.current = true;

      setHouseholds(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load households';
      setError(errorMessage);
      console.error('Households fetch error:', err);
    } finally {
      setIsLoading(false);
      fetchPromise = null; // Clear promise after completion
    }
  }, [user, client]);

  const createHousehold = useCallback(async (data: any): Promise<Household> => {
    const newHousehold = await client.post<Household>('/households', data);
    await fetchDetailedHouseholds(true); // Force refetch after create
    await refetchContext(); // Also refresh context
    return newHousehold;
  }, [client, fetchDetailedHouseholds, refetchContext]);

  const leaveHousehold = useCallback(async (householdId: string): Promise<void> => {
    await client.post(`/households/${householdId}/leave`, {});
    await fetchDetailedHouseholds(true); // Force refetch after leaving
    await refetchContext(); // Also refresh context
  }, [client, fetchDetailedHouseholds, refetchContext]);

  const updateHousehold = useCallback(async (householdId: string, data: any): Promise<Household> => {
    const updatedHousehold = await client.patch<Household>(`/households/${householdId}`, data);
    await fetchDetailedHouseholds(true); // Force refetch after update
    await refetchContext(); // Also refresh context
    return updatedHousehold;
  }, [client, fetchDetailedHouseholds, refetchContext]);

  const deleteHousehold = useCallback(async (householdId: string): Promise<void> => {
    await client.delete(`/households/${householdId}`);
    await fetchDetailedHouseholds(true); // Force refetch after delete
    await refetchContext(); // Also refresh context
  }, [client, fetchDetailedHouseholds, refetchContext]);

  // Load detailed households on mount and when user changes
  useEffect(() => {
    fetchDetailedHouseholds();
  }, [fetchDetailedHouseholds]);

  return {
    households,
    isLoading: isLoading || contextLoading,
    error,
    refetch: async () => {
      await fetchDetailedHouseholds(true);
      await refetchContext();
    },
    createHousehold,
    leaveHousehold,
    updateHousehold,
    deleteHousehold,
  };
}; 