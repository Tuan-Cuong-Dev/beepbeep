// src/lib/notify.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-client';

export type NotifyInput = {
  templateId: string;
  audience: { type: 'user'; uid: string };      // MVP
  data: Record<string, any>;
  requiredChannels?: Array<'inapp'|'push'|'zalo'|'viber'|'email'|'sms'>;
  topic?: string;
};

export async function enqueueNotification(input: NotifyInput) {
  return addDoc(collection(db, 'notificationJobs'), {
    ...input,
    status: 'queued',
    createdAt: serverTimestamp(),
  });
}
