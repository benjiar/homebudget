import { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { createApiClient, ApiClient } from '@/lib/apiClient';

/**
 * Hook that provides an API client configured with current auth token and selected households
 * The client automatically includes x-household-ids header in all requests
 */
export function useApiClient(): ApiClient {
    const { session } = useAuth();
    const { selectedHouseholdIds } = useHousehold();

    const client = useMemo(() => {
        return createApiClient();
    }, []);

    // Update token whenever session changes
    useEffect(() => {
        const token = session?.access_token;
        if (token) {
            client.setToken(token);
        }
    }, [client, session?.access_token]);

    // Update household IDs whenever they change
    useEffect(() => {
        client.setHouseholdIds(selectedHouseholdIds);
    }, [client, selectedHouseholdIds]);

    return client;
}
