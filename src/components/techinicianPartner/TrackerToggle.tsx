'use client';

import { useMemo, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useTechLivePublisher } from '@/src/hooks/useTechLivePublisher';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { COLLECTIONS } from '@/src/lib/tracking/collections';
import { Play, Pause, Square } from 'lucide-react';

export default function TrackerToggle() {
  const { user } = useUser();
  const { t } = useTranslation('common');

  const techId = user?.uid || '';
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Tạo/ghi sessionId cục bộ
  const effectiveSession = useMemo(
    () => sessionId ?? (enabled ? uuid() : null),
    [enabled, sessionId]
  );

  // Gửi tọa độ khi đang Online & không Paused
  const { error } = useTechLivePublisher({
    techId,
    name: user?.name,
    companyName: (user as any)?.companyName,
    sessionId: effectiveSession || 'no-session',
    enabled: enabled && !paused && !!effectiveSession,
    /** 👇 truyền photoURL từ user */
    avatarUrl: user?.photoURL || null
  });


  const vibrate = (pattern: number | number[]) => {
    try {
      (navigator as any)?.vibrate?.(pattern);
    } catch {}
  };

  const goOnline = useCallback(async () => {
    if (!techId) return;
    const sid = uuid();
    setSessionId(sid);
    setEnabled(true);
    setPaused(false);

    await setDoc(
      doc(db, COLLECTIONS.sessions(techId), sid),
      { sessionId: sid, techId, startedAt: serverTimestamp() },
      { merge: true }
    );
    vibrate(15);
  }, [techId]);

  const endShift = useCallback(async () => {
    if (!techId) return;
    if (sessionId) {
      await setDoc(
        doc(db, COLLECTIONS.sessions(techId), sessionId),
        { endedAt: serverTimestamp() },
        { merge: true }
      );
    }
    setEnabled(false);
    setPaused(false);
    setSessionId(null);

    await setDoc(
      doc(db, COLLECTIONS.presence, techId),
      { status: 'offline', updatedAt: serverTimestamp() },
      { merge: true }
    );
    vibrate([10, 30, 10]);
  }, [techId, sessionId]);

  // ----- UI helpers -----
  const StatusBadge = () => {
    if (!enabled) return <Badge variant="default">• Offline</Badge>;
    if (paused) return <Badge variant="warning">• {t('tech_tracker.status_paused')}</Badge>;
    return <Badge variant="success">• {t('tech_tracker.status_online')}</Badge>;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      {/* Trạng thái */}
      <StatusBadge />

      {/* Nhóm nút điều khiển (ưu tiên mobile) */}
      {!enabled ? (
        <Button
          className="bg-[#00d289] hover:bg-emerald-700 text-white font-semibold rounded-xl h-12 sm:h-10"
          onClick={goOnline}
          aria-label="Start shift and go online"
        >
          <Play className="w-4 h-4 mr-2" />
          {t('tech_tracker.go_online')}
        </Button>
      ) : !paused ? (
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none rounded-xl h-12 sm:h-10"
            onClick={() => {
              setPaused(true);
              vibrate(10);
            }}
            aria-label="Pause tracking"
          >
            <Pause className="w-4 h-4 mr-2" />
            {t('tech_tracker.pause')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1 sm:flex-none rounded-xl h-12 sm:h-10"
            onClick={endShift}
            aria-label="End shift"
          >
            <Square className="w-4 h-4 mr-2" />
            {t('tech_tracker.end_shift')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            className="flex-1 sm:flex-none bg-[#00d289] hover:bg-emerald-700 text-white rounded-xl h-12 sm:h-10"
            onClick={() => {
              setPaused(false);
              vibrate(10);
            }}
            aria-label="Resume tracking"
          >
            <Play className="w-4 h-4 mr-2" />
            {t('tech_tracker.resume')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1 sm:flex-none rounded-xl h-12 sm:h-10"
            onClick={endShift}
            aria-label="End shift"
          >
            <Square className="w-4 h-4 mr-2" />
            {t('tech_tracker.end_shift')}
          </Button>
        </div>
      )}

      {/* Lỗi (nếu có) */}
      {error && <span className="text-rose-600 text-sm">{error}</span>}
    </div>
  );
}
