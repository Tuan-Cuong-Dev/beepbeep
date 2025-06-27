// pages/api/createUser.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import serviceAccount from '@/src/firebaseAdminConfig.json';
import type { ServiceAccount } from 'firebase-admin';


if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
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
