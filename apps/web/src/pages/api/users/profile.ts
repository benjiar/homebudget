import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return proxyToBackend(req, res, '/users/profile');
  }

  if (req.method === 'PATCH') {
    return proxyToBackend(req, res, '/users/profile', { method: 'PATCH' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 