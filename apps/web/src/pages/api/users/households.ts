import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/api';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get auth token from Supabase session
    const supabase = createClient(req, res);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetch(`${BACKEND_URL}/users/households`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Backend returned ${response.status}` };
      }
      console.error('Backend error:', response.status, errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Transform the backend response to match frontend expectations
    // Backend returns: { household_memberships: [{ household: {...} }] }
    // Frontend expects: [{ id, name, ... }]
    let households = [];
    if (data.household_memberships && Array.isArray(data.household_memberships)) {
      households = data.household_memberships
        .filter((membership: any) => membership.is_active && membership.household)
        .map((membership: any) => ({
          id: membership.household.id,
          name: membership.household.name,
          description: membership.household.description,
          currency: membership.household.currency,
          role: membership.role,
          created_at: membership.household.created_at,
          updated_at: membership.household.updated_at,
        }));
    }

    return res.status(200).json(households);
  } catch (error) {
    console.error('Households fetch error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 