import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid budget ID' });
    }

    switch (req.method) {
        case 'GET':
            // GET /budgets/:id - get single budget
            return proxyToBackend(req, res, `/budgets/${id}`);

        case 'PUT':
        case 'PATCH':
            // PUT/PATCH /budgets/:id - update budget
            return proxyToBackend(req, res, `/budgets/${id}`, { method: 'PUT' });

        case 'DELETE':
            // DELETE /budgets/:id - delete budget
            return proxyToBackend(req, res, `/budgets/${id}`, { method: 'DELETE' });

        default:
            return res.status(405).json({ message: 'Method not allowed' });
    }
}
