/**
 * Centralized API client with automatic household header injection
 * 
 * With SSR pattern:
 * - Auth cookies are automatically sent to /api/* routes
 * - No need to manually pass Authorization headers
 * - API routes extract session from cookies server-side
 */

export interface ApiClientConfig {
    householdIds?: string[];
}

export class ApiClient {
    private baseUrl: string;
    private defaultConfig: ApiClientConfig;

    constructor(baseUrl: string = '/api', defaultConfig: ApiClientConfig = {}) {
        this.baseUrl = baseUrl;
        this.defaultConfig = defaultConfig;
    }

    /**
     * Build headers with household IDs
     * Auth is handled automatically via cookies
     */
    private buildHeaders(config?: ApiClientConfig): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const householdIds = config?.householdIds || this.defaultConfig.householdIds || [];

        // If householdIds is not empty, add the header as comma-separated string
        // If empty, omit the header (backend will return all user households)
        if (householdIds.length > 0) {
            headers['x-household-ids'] = householdIds.join(',');
        }

        return headers;
    }

    /**
     * Generic fetch wrapper
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        config?: ApiClientConfig
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders(config);

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API Error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, config?: ApiClientConfig): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' }, config);
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: any, config?: ApiClientConfig): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'POST',
                body: JSON.stringify(body),
            },
            config
        );
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: any, config?: ApiClientConfig): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'PATCH',
                body: JSON.stringify(body),
            },
            config
        );
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, config?: ApiClientConfig): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' }, config);
    }

    /**
     * Upload file (multipart/form-data)
     */
    async upload<T>(endpoint: string, formData: FormData, config?: ApiClientConfig): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Build headers without Content-Type (browser will set it with boundary)
        // Auth cookies are automatically sent with the request
        const headers: HeadersInit = {};

        const householdIds = config?.householdIds || this.defaultConfig.householdIds || [];
        if (householdIds.length > 0) {
            headers['x-household-ids'] = householdIds.join(',');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API Error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update default config (useful for setting households globally)
     */
    setDefaultConfig(config: Partial<ApiClientConfig>) {
        this.defaultConfig = { ...this.defaultConfig, ...config };
    }

    /**
     * Set household IDs
     */
    setHouseholdIds(householdIds: string[]) {
        this.defaultConfig.householdIds = householdIds;
    }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export a hook-friendly function to create instances
export function createApiClient(config?: ApiClientConfig): ApiClient {
    return new ApiClient('/api', config);
}
