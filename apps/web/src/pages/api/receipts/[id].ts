import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Receipt ID is required' });
  }

  const path = `/receipts/${id}`;

  switch (req.method) {
    case 'GET':
      return proxyToBackend(req, res, path);

    case 'PATCH':
      return proxyToBackend(req, res, path, { method: 'PATCH' });

    case 'DELETE':
      return proxyToBackend(req, res, path, { method: 'DELETE' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 