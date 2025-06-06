import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { householdsCache, invalidateHouseholdsCache } from '@/lib/householdsCache';
import { Household } from '@homebudget/types';

interface UseHouseholdsWithCacheReturn {
  households: Household[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidateAndRefetch: () => Promise<void>;
  createHousehold: (data: any) => Promise<Household>;
  leaveHousehold: (householdId: string) => Promise<void>;
  updateHousehold: (householdId: string, data: any) => Promise<Household>;
  deleteHousehold: (householdId: string) => Promise<void>;
}

export const useHouseholdsWithCache = (): UseHouseholdsWithCacheReturn => {
  const { user, getAccessToken } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholds = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const cachedHouseholds = await householdsCache.get(user.id, accessToken);
      setHouseholds(cachedHouseholds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load households';
      setError(errorMessage);
      console.error('Households fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken]);

  const invalidateAndRefetch = useCallback(async () => {
    if (user) {
      invalidateHouseholdsCache(user.id);
      await fetchHouseholds();
    }
  }, [user, fetchHouseholds]);

  const createHousehold = useCallback(async (data: any): Promise<Household> => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('/api/households', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create household');
    }

    const newHousehold = await response.json();
    
    // Invalidate cache and refetch
    await invalidateAndRefetch();
    
    return newHousehold;
  }, [getAccessToken, invalidateAndRefetch]);

  const leaveHousehold = useCallback(async (householdId: string): Promise<void> => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`/api/households/${householdId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to leave household');
    }

    // Invalidate cache and refetch
    await invalidateAndRefetch();
  }, [getAccessToken, invalidateAndRefetch]);

  const updateHousehold = useCallback(async (householdId: string, data: any): Promise<Household> => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`/api/households/${householdId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update household');
    }

    const updatedHousehold = await response.json();
    
    // Invalidate cache and refetch
    await invalidateAndRefetch();
    
    return updatedHousehold;
  }, [getAccessToken, invalidateAndRefetch]);

  const deleteHousehold = useCallback(async (householdId: string): Promise<void> => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`/api/households/${householdId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete household');
    }

    // Invalidate cache and refetch
    await invalidateAndRefetch();
  }, [getAccessToken, invalidateAndRefetch]);

  // Load households on mount and when user changes
  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  return {
    households,
    isLoading,
    error,
    refetch: fetchHouseholds,
    invalidateAndRefetch,
    createHousehold,
    leaveHousehold,
    updateHousehold,
    deleteHousehold,
  };
}; 