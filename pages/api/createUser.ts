// pages/api/createUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/src/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔵 Incoming request:', req.method, req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || '',
    });

    return res.status(200).json({ uid: userRecord.uid });
  } catch (error: any) {
    console.error('❌ Admin createUser failed:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

