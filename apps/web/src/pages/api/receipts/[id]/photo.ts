import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { createClient } from '@/lib/supabase/api';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getAuthToken(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  const supabase = createClient(req, res);
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Receipt ID is required' });
  }

  // Get auth token
  const token = await getAuthToken(req, res);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    return await handlePhotoUpload(req, res, id, token);
  } else if (req.method === 'DELETE') {
    return await handlePhotoDelete(req, res, id, token);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handlePhotoUpload(req: NextApiRequest, res: NextApiResponse, receiptId: string, token: string) {
  try {
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowEmptyFiles: false,
      maxFiles: 1,
    });

    const [, files] = await form.parse(req);

    const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;

    if (!photoFile) {
      return res.status(400).json({ message: 'Photo file is required' });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photoFile.mimetype || '')) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' });
    }

    // Create FormData for the backend request
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(photoFile.filepath);
    const blob = new Blob([fileBuffer], { type: photoFile.mimetype || 'image/jpeg' });

    formData.append('photo', blob, photoFile.originalFilename || 'photo.jpg');

    const response = await fetch(`${BACKEND_URL}/receipts/${receiptId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    // Clean up temporary file
    fs.unlinkSync(photoFile.filepath);

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handlePhotoDelete(_req: NextApiRequest, res: NextApiResponse, receiptId: string, token: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/receipts/${receiptId}/photo`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Photo delete error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 