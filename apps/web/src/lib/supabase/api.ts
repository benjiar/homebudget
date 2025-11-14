import { createServerClient } from '@supabase/ssr';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Create a Supabase client for use in API routes (pages/api)
 * This client manages cookies through the request/response objects
 */
export function createClient(req: NextApiRequest, res: NextApiResponse) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    // Parse cookies from the request
                    const cookies = req.cookies;
                    return Object.keys(cookies).map(name => ({
                        name,
                        value: cookies[name] || '',
                    }));
                },
                setAll(cookiesToSet) {
                    // Set cookies on the response
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.setHeader(
                            'Set-Cookie',
                            `${name}=${value}; Path=${options?.path || '/'}; ${options?.maxAge ? `Max-Age=${options.maxAge};` : ''
                            } ${options?.httpOnly ? 'HttpOnly;' : ''} ${options?.secure ? 'Secure;' : ''
                            } ${options?.sameSite ? `SameSite=${options.sameSite};` : ''}`
                        );
                    });
                },
            },
        }
    );
}
