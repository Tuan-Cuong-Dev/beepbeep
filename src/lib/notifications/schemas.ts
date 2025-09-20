// src/lib/notifications/schemas.ts
import { z } from 'zod';

export const channelEnum = z.enum(['inapp','push','email','sms','zalo','viber']);

export const sendPayloadSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  actionUrl: z.string().url().optional(),
});

export const targetInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  zaloUserId: z.string().optional(),
  viberUserId: z.string().optional(),
  fcmToken: z.string().optional(),
});

export const enqueueJobSchema = z.object({
  uid: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  actionUrl: z.string().url().optional(),
  topic: z.string().optional(),
  channels: z.array(channelEnum).min(1),
  target: targetInfoSchema.optional(),
  templateId: z.string().optional(),
  data: z.record(z.any()).optional(),
  locale: z.string().optional(),
  priority: z.enum(['low','normal','high']).optional(),
  scheduledAt: z.number().optional(),
});
