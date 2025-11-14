import { createClient } from '@/lib/supabase/api';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Auth callback handler for OAuth flows (e.g., Google sign-in)
 * Exchanges the auth code for a session and redirects to home
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const code = req.query.code as string;

    if (code) {
        const supabase = createClient(req, res);
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to home page after auth
    res.redirect(303, '/');
}
