import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin:', err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, role } = req.body;
  if (!uid || !role) {
    return res.status(400).json({ error: 'Missing uid or role' });
  }

  try {
    await getAuth().setCustomUserClaims(uid, { role });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error setting custom claims:', err);
    return res.status(500).json({ error: 'Failed to set custom claims' });
  }
}
