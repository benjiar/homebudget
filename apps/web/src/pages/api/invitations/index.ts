import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            // GET /invitations - with household filter via header
            return proxyToBackend(req, res, '/invitations');

        case 'POST':
            // POST /invitations/invite - create invitation
            return proxyToBackend(req, res, '/invitations/invite', { method: 'POST' });

        default:
            return res.status(405).json({ message: 'Method not allowed' });
    }
}
