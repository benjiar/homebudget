import { useMemo, useEffect } from 'react';
import { useHousehold } from '@/contexts/HouseholdContext';
import { createApiClient, ApiClient } from '@/lib/apiClient';

/**
 * Hook that provides an API client configured with selected households
 * 
 * With SSR pattern:
 * - Auth cookies are automatically sent with every request to /api/*
 * - No need to manually manage tokens
 * - API routes extract session from cookies server-side
 */
export function useApiClient(): ApiClient {
    const { selectedHouseholdIds } = useHousehold();

    const client = useMemo(() => {
        return createApiClient();
    }, []);

    // Update household IDs whenever they change
    useEffect(() => {
        client.setHouseholdIds(selectedHouseholdIds);
    }, [client, selectedHouseholdIds]);

    return client;
}
