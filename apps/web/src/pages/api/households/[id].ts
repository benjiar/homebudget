import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const path = `/households/${id}`;

  if (req.method === 'GET') {
    return proxyToBackend(req, res, path);
  }

  if (req.method === 'PATCH') {
    return proxyToBackend(req, res, path, { method: 'PATCH' });
  }

  if (req.method === 'DELETE') {
    return proxyToBackend(req, res, path, { method: 'DELETE' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 