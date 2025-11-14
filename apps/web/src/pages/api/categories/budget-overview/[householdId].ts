import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { householdId, month, year } = req.query;

  if (!householdId || Array.isArray(householdId)) {
    return res.status(400).json({ message: 'Household ID is required' });
  }

  const queryParams = new URLSearchParams();
  if (month) queryParams.append('month', month as string);
  if (year) queryParams.append('year', year as string);

  const path = `/categories/household/${householdId}/budget-overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return proxyToBackend(req, res, path);
} 