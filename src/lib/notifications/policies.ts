import type { Channel, UserNotificationPreferences, Topic } from './types';

export const DEFAULT_PRIORITY: Channel[] = ['inapp','push','zalo','viber','email','sms'];

export function isQuietHours(nowLocalHHmm: string, pref?: UserNotificationPreferences) {
  if (!pref?.quietHours) return false;
  const { start, end } = pref.quietHours; // "22:00" to "07:00"
  if (start === end) return false;
  return start < end
    ? (nowLocalHHmm >= start && nowLocalHHmm < end)
    : (nowLocalHHmm >= start || nowLocalHHmm < end);
}

export function allowedChannels(
  topic: Topic,
  pref: UserNotificationPreferences,
  requested?: Channel[],
): Channel[] {
  const base = requested ?? DEFAULT_PRIORITY;
  return base.filter(ch => pref.channelOptIn?.[ch] !== false)
             .filter(_ => pref.topicOptIn?.[topic] !== false);
}
