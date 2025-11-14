import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyToBackend } from '@/lib/apiProxy';
import { getAuthToken } from '@/lib/apiProxy';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Disable body parsing for multipart data
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleMultipartUpload(req: NextApiRequest, res: NextApiResponse) {
  const token = await getAuthToken(req, res);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Build headers - preserve the original Content-Type with boundary
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': req.headers['content-type'] || '',
    };

    // Forward x-household-ids if present
    const householdIds = req.headers['x-household-ids'];
    if (householdIds) {
      headers['x-household-ids'] = householdIds as string;
    }

    // Forward the raw request stream to backend
    const response = await fetch(`${BACKEND_URL}/receipts`, {
      method: 'POST',
      headers,
      body: req as any, // Pass the request object directly as the stream
      // @ts-ignore - duplex is needed for streaming
      duplex: 'half',
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ error: 'Failed to upload to backend' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Build query string from query params
  const queryString = new URLSearchParams(req.query as any).toString();
  const path = `/receipts${queryString ? `?${queryString}` : ''}`;

  switch (req.method) {
    case 'GET':
      // GET /receipts - with household filter via header and query params
      return proxyToBackend(req, res, path);

    case 'POST':
      // Check if this is a multipart request
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        return handleMultipartUpload(req, res);
      }
      // Regular JSON POST
      return proxyToBackend(req, res, '/receipts', { method: 'POST' });

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
} 