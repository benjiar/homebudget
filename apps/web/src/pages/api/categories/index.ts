import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      // GET /categories - with household filter via header
      return proxyToBackend(req, res, '/categories');

    case 'POST':
      // POST /categories - create new category
      return proxyToBackend(req, res, '/categories', { method: 'POST' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 