import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Build query string from query params
  const queryString = new URLSearchParams(req.query as any).toString();
  const path = `/receipts${queryString ? `?${queryString}` : ''}`;

  switch (req.method) {
    case 'GET':
      // GET /receipts - with household filter via header and query params
      return proxyToBackend(req, res, path);

    case 'POST':
      // POST /receipts - create new receipt
      return proxyToBackend(req, res, '/receipts', { method: 'POST' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 