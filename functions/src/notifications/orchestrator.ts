import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { DateTime } from 'luxon';

const RUNTIME_REGION = 'asia-southeast1';
const FUNCTIONS_BASE = process.env.FUNCTIONS_BASE_URL; 
// ví dụ: https://<region>-<project>.cloudfunctions.net

type Channel = 'inapp'|'push'|'zalo'|'viber'|'email'|'sms';

type SendPayload = { title: string; body: string; actionUrl?: string };

export const onNotificationJobCreate = functions
  .region(RUNTIME_REGION)
  .firestore.document('notificationJobs/{jobId}')
  .onCreate(async (snap, ctx) => {
    const job = snap.data() as any;
    const db = admin.firestore();

    // Resolve audience (MVP: 1 uid)
    const uids: string[] = job?.audience?.type === 'user' ? [job.audience.uid] : [];
    if (uids.length === 0) return;

    // Load template from collection or memory map
    const tplDoc = await db.collection('notificationTemplates').doc(job.templateId).get();
    const tpl = tplDoc.exists ? tplDoc.data() as any : null;
    if (!tpl) {
      await snap.ref.update({ status: 'failed', error: 'template_not_found' });
      return;
    }

    for (const uid of uids) {
      const prefDoc = await db.collection('userNotificationPreferences').doc(uid).get();
      if (!prefDoc.exists) continue;
      const pref = prefDoc.data() as any;

      // Render payload
      const lang = pref.language ?? 'vi';
      const render = (s: string) =>
        s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
          const v = k.split('.').reduce((o: any, kk: string) => o?.[kk], job.data);
          return (v ?? '').toString();
        });
      const payload: SendPayload = {
        title: render(tpl.title?.[lang] || tpl.title?.vi || ''),
        body: render(tpl.body?.[lang] || tpl.body?.vi || ''),
        actionUrl: job.data?.actionUrl,
      };

      // Decide channels (MVP: theo template)
      const channels: Channel[] = job.requiredChannels || tpl.channels || ['inapp','push'];

      // Quiet hours?
      const now = DateTime.now().setZone(pref.timezone || 'Asia/Ho_Chi_Minh').toFormat('HH:mm');
      const inQuiet = (() => {
        const q = pref.quietHours;
        if (!q?.start || !q?.end) return false;
        return q.start < q.end ? (now >= q.start && now < q.end) : (now >= q.start || now < q.end);
      })();

      // In-app ngay
      if (channels.includes('inapp')) {
        await fetch(`${FUNCTIONS_BASE}/sendInapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, uid, payload, topic: job.topic }),
        }).catch(() => null);
      }

      // Các kênh còn lại
      const rest = channels.filter((c: Channel) => c !== 'inapp');

      for (const ch of rest) {
        if (inQuiet) {
          // Đánh dấu pending (tuỳ policy bạn có cron dọn)
          await db.collection('deliveries').doc(`${job.id}_${ch}_${uid}`).set({
            id: `${job.id}_${ch}_${uid}`,
            jobId: job.id,
            uid,
            channel: ch,
            status: 'pending',
            createdAt: Date.now(),
          }, { merge: true });
          continue;
        }

        // Gọi worker
        const url = `${FUNCTIONS_BASE}/send${ch.charAt(0).toUpperCase() + ch.slice(1)}`;
        const target = {
          push: { tokens: pref.contact?.fcmTokens || [] },
          zalo: { zaloUserId: pref.contact?.zaloUserId },
          viber: { viberUserId: pref.contact?.viberUserId },
          email: { to: pref.contact?.email },
          sms: { to: pref.contact?.phone },
        }[ch] || {};

        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, uid, payload, target }),
        }).catch((e) => functions.logger.error(`send ${ch} error`, e));
      }
    }

    await snap.ref.update({ status: 'processing' });
  });
