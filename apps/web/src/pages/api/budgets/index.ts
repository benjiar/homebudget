import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            // GET /budgets - with household filter via header
            return proxyToBackend(req, res, '/budgets');

        case 'POST':
            // POST /budgets - create new budget
            return proxyToBackend(req, res, '/budgets', { method: 'POST' });

        default:
            return res.status(405).json({ message: 'Method not allowed' });
    }
}
