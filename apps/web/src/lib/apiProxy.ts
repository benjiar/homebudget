import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from './supabase/api';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Extract and validate the auth token from Supabase session
 */
export async function getAuthToken(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
    const supabase = createClient(req, res);
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

/**
 * Build headers for backend request, including household IDs header
 */
export function buildBackendHeaders(req: NextApiRequest, token: string): HeadersInit {
    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    // Forward x-household-ids header if present
    const householdIds = req.headers['x-household-ids'];
    if (householdIds) {
        headers['x-household-ids'] = householdIds as string;
    }

    return headers;
}

/**
 * Generic proxy function to forward requests to backend
 */
export async function proxyToBackend(
    req: NextApiRequest,
    res: NextApiResponse,
    backendPath: string,
    options: {
        method?: string;
        body?: any;
        requireAuth?: boolean;
    } = {}
) {
    const { method = req.method, body = req.body, requireAuth = true } = options;

    try {
        // Get auth token from Supabase session
        const token = await getAuthToken(req, res);
        if (requireAuth && !token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Build request
        const url = `${BACKEND_URL}${backendPath}`;
        const headers = token ? buildBackendHeaders(req, token) : { 'Content-Type': 'application/json' };

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(body);
        }

        // Forward to backend
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        // Return response
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Handle multipart form data (file uploads)
 * Note: Actual implementation would require formidable or similar library
 */
export async function proxyMultipartToBackend(
    req: NextApiRequest,
    res: NextApiResponse,
    _backendPath: string
) {
    try {
        const token = await getAuthToken(req, res);
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Placeholder - actual implementation would use formidable or similar
        return res.status(501).json({ error: 'Multipart upload not implemented in this helper' });
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}