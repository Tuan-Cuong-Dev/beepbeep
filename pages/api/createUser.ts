import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';

// ✅ Khởi tạo Firebase Admin nếu chưa tồn tại
if (!getApps().length) {
  const rawCredentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!rawCredentials) {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS is not set');
  }

  const serviceAccount = JSON.parse(rawCredentials) as ServiceAccount;

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, name } = req.body;

  // ✅ Validate đầu vào
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRecord = await getAuth().createUser({
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
