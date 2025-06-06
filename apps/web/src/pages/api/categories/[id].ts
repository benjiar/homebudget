import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Category ID is required' });
  }

  const allowedMethods = ['GET', 'PATCH', 'DELETE'];
  if (!allowedMethods.includes(req.method!)) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/categories/${id}`, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
      body: ['PATCH'].includes(req.method!) ? JSON.stringify(req.body) : undefined,
    });

    if (req.method === 'DELETE' && response.ok) {
      return res.status(200).json({ message: 'Category deleted successfully' });
    }

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Category operation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 