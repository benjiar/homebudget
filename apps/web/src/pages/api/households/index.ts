import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return proxyToBackend(req, res, '/households');
  }

  if (req.method === 'POST') {
    return proxyToBackend(req, res, '/households', { method: 'POST' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 