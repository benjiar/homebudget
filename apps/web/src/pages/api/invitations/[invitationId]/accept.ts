import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { invitationId } = req.query;
  return proxyToBackend(req, res, `/invitations/${invitationId}/accept`, { method: 'POST' });
} 