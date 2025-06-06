import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { householdId } = req.query;
  const { month, year } = req.query;

  if (!householdId || Array.isArray(householdId)) {
    return res.status(400).json({ message: 'Household ID is required' });
  }

  try {
    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month as string);
    if (year) queryParams.append('year', year as string);

    const response = await fetch(`${BACKEND_URL}/categories/household/${householdId}/budget-overview?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Budget overview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 