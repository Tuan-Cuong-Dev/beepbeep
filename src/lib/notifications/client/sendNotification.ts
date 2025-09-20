import { db } from '@/src/firebaseConfig';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Channel, NotificationJob, Topic } from '../types';

export async function createNotificationJob(params: {
  templateId: string;
  topic: Topic;
  audience: { type:'user'; uid:string } | { type:'segment'; filter:Record<string,any> };
  data: Record<string,any>;
  requiredChannels?: Channel[];
  dedupeKey?: string;
  scheduleAt?: number;
  createdBy?: string;
}) {
  const ref = doc(collection(db, 'notificationJobs'));
  const job: NotificationJob = {
    id: ref.id,
    templateId: params.templateId,
    templateVersion: 1,
    topic: params.topic,
    audience: params.audience,
    data: params.data,
    requiredChannels: params.requiredChannels,
    dedupeKey: params.dedupeKey,
    scheduleAt: params.scheduleAt,
    createdBy: params.createdBy,
    createdAt: Date.now(),
    status: 'queued',
  };
  await setDoc(ref, job);
  return job.id;
}
