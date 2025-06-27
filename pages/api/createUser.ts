import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG || '{}') as ServiceAccount;

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email, password, name } = req.body;

  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name || '',
    });

    res.status(200).json({ uid: userRecord.uid });
  } catch (error: any) {
    console.error('❌ Admin createUser failed:', error.message);
    res.status(500).json({ error: error.message });
  }
}
