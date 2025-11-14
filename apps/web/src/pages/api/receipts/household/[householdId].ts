import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { householdId } = req.query;

  // Forward all query parameters to the backend
  const queryParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'householdId' && value) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  });

  const path = `/receipts/household/${householdId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return proxyToBackend(req, res, path);
} 