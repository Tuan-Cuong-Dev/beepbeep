// Phần Notification Platform phát triển từ 18/09/2025

'use client';

import { useNotificationPreferences } from '@/src/hooks/useNotificationPreferences';
import { useUser } from '@/src/context/AuthContext';
import { db } from '@/src/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import type { Channel } from '@/src/lib/notifications/types';

// Khai báo danh sách kênh với kiểu rõ ràng
const CHANNELS: Channel[] = ['push', 'zalo', 'viber', 'email', 'sms'];

export default function OptInPreferencesForm() {
  const { user } = useUser();
  const { pref, loading } = useNotificationPreferences(user?.uid);

  if (loading || !pref) return null;

  const isEnabled = (ch: Channel) => pref.channelOptIn?.[ch] !== false;

  const toggle = async (ch: Channel) => {
    const ref = doc(db, 'userNotificationPreferences', pref.uid);
    await updateDoc(ref, {
      [`channelOptIn.${ch}`]: !isEnabled(ch),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 border">
      <h3 className="font-semibold mb-2">Tuỳ chọn nhận thông báo</h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {CHANNELS.map((ch) => {
          const on = isEnabled(ch);
          return (
            <button
              key={ch}
              className={`px-3 py-2 rounded border ${
                on ? 'bg-[#00d289]/10 border-[#00d289]' : ''
              }`}
              onClick={() => toggle(ch)}
              type="button"
            >
              {ch.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Quiet hours start</label>
          <Input
            defaultValue={pref.quietHours?.start ?? '22:00'}
            onBlur={async (e) =>
              updateDoc(doc(db, 'userNotificationPreferences', pref.uid), {
                quietHours: { ...(pref.quietHours ?? {}), start: e.target.value },
                updatedAt: Date.now(),
              })
            }
          />
        </div>
        <div>
          <label className="text-sm">Quiet hours end</label>
          <Input
            defaultValue={pref.quietHours?.end ?? '07:00'}
            onBlur={async (e) =>
              updateDoc(doc(db, 'userNotificationPreferences', pref.uid), {
                quietHours: { ...(pref.quietHours ?? {}), end: e.target.value },
                updatedAt: Date.now(),
              })
            }
          />
        </div>
      </div>

      <div className="mt-2">
        <Button onClick={() => { /* mở flow liên kết Zalo/Viber */ }}>
          Liên kết Zalo/Viber
        </Button>
      </div>
    </div>
  );
}
