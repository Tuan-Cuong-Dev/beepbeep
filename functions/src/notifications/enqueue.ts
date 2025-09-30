import * as functions from 'firebase-functions';
import { db } from '../utils/db.js';

export const enqueueNotificationJob = functions
  .region('asia-southeast1')
  .https.onCall(async (data, ctx) => {
    if (!ctx.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }
    const { templateId, data: payload = {}, requiredChannels, topic } = data || {};
    const doc = await db.collection('notificationJobs').add({
      templateId,
      audience: { type: 'user', uid: ctx.auth.uid },
      data: payload,
      requiredChannels,
      topic,
      status: 'queued',
      createdAt: Date.now(),
    });
    return { id: doc.id };
  });
