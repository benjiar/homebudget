import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { categoryId } = req.query;

    if (!categoryId || Array.isArray(categoryId)) {
        return res.status(400).json({ message: 'Category ID is required' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Forward query params and household filter via header
    const queryString = new URLSearchParams(req.query as any).toString();
    const path = `/receipts/category/${categoryId}${queryString ? `?${queryString}` : ''}`;

    return proxyToBackend(req, res, path);
}
