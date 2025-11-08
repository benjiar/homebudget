import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Forward query params (startDate, endDate) and household filter via header
    const queryString = new URLSearchParams(req.query as any).toString();
    const path = `/receipts/expenses-by-date${queryString ? `?${queryString}` : ''}`;

    return proxyToBackend(req, res, path);
}
