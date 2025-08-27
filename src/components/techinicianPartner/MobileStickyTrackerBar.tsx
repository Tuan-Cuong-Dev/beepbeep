'use client';

import { useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Square, Satellite, ShieldCheck } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useUser } from '@/src/context/AuthContext';
import { useTechLivePublisher } from '@/src/hooks/useTechLivePublisher';
import { db } from '@/src/firebaseConfig';
import { COLLECTIONS } from '@/src/lib/tracking/collections';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 🔥 Sticky bar dành cho mobile:
 * - Cố định cuối màn hình, tôn trọng safe-area (iOS).
 * - Nút to, dễ bấm khi di chuyển.
 * - Tự chứa logic tracking, KHÔNG dùng cùng lúc với TrackerToggle (để tránh ghi trùng).
 *
 * Gợi ý dùng: <MobileStickyTrackerBar className="sm:hidden" />
 */
export default function MobileStickyTrackerBar({ className = '' }: { className?: string }) {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const techId = user?.uid || '';
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const effectiveSession = useMemo(
    () => sessionId ?? (enabled ? uuid() : null),
    [enabled, sessionId]
  );

  const { error } = useTechLivePublisher({
    techId,
    name: user?.name,
    companyName: (user as any)?.companyName,
    sessionId: effectiveSession || 'no-session',
    enabled: enabled && !paused && !!effectiveSession,
  });

  const goOnline = async () => {
    const sid = uuid();
    setSessionId(sid);
    setEnabled(true);
    setPaused(false);
    await setDoc(doc(db, COLLECTIONS.sessions(techId), sid), {
      sessionId: sid,
      techId,
      startedAt: serverTimestamp(),
    }, { merge: true });
    if ('vibrate' in navigator) (navigator as any).vibrate?.(15);
  };

  const endShift = async () => {
    if (techId && sessionId) {
      await setDoc(doc(db, COLLECTIONS.sessions(techId), sessionId), {
        endedAt: serverTimestamp(),
      }, { merge: true });
    }
    setEnabled(false);
    setPaused(false);
    setSessionId(null);
    if (techId) {
      await setDoc(doc(db, COLLECTIONS.presence, techId), {
        status: 'offline',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    if ('vibrate' in navigator) (navigator as any).vibrate?.([10, 30, 10]);
  };

  return (
    <div
      className={[
        // container fixed bottom
        'fixed inset-x-0 bottom-0 z-50',
        // safe area bottom + padding
        'pb-[calc(env(safe-area-inset-bottom,0)+12px)] px-3',
        className,
      ].join(' ')}
    >
      <div
        className="
          mx-auto max-w-3xl
          rounded-2xl border border-gray-200 bg-white/90 backdrop-blur
          shadow-lg
          dark:border-gray-800 dark:bg-neutral-900/80
        "
      >
        {/* Top row: title + status + session */}
        <div className="px-3 pt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#e6fff5] text-[#00d289]">
              <Satellite className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
                {t('admin_live_map_page.map.title')}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {user?.name || 'Technician'} · {enabled ? (paused ? t('tech_tracker.status_paused') : t('tech_tracker.status_online')) : 'Offline'}
              </p>
            </div>
          </div>
          {/* session short id */}
          <div className="hidden xs:block text-[11px] text-gray-500 dark:text-gray-400">
            <ShieldCheck className="inline w-3.5 h-3.5 mr-1" />
            {enabled && sessionId ? `#${sessionId.slice(0, 6)}` : '—'}
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 grid grid-cols-3 gap-2">
          {!enabled ? (
            <>
              <Button
                onClick={goOnline}
                className="col-span-3 h-12 text-base font-semibold bg-[#00d289] hover:bg-emerald-700 rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('tech_tracker.go_online')}
              </Button>
            </>
          ) : !paused ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setPaused(true);
                  if ('vibrate' in navigator) (navigator as any).vibrate?.(10);
                }}
                className="col-span-1 h-12 rounded-xl"
              >
                <Pause className="w-5 h-5 mr-1" />
                {t('tech_tracker.pause')}
              </Button>
              <div className="col-span-1 h-12 rounded-xl grid place-items-center text-sm text-gray-600 dark:text-gray-300">
                {/* Hint center cell */}
                <span className="text-[11px] leading-tight text-center">
                  {t('tech_tracker_hint')}
                </span>
              </div>
              <Button
                variant="destructive"
                onClick={endShift}
                className="col-span-1 h-12 rounded-xl"
              >
                <Square className="w-5 h-5 mr-1" />
                {t('tech_tracker.end_shift')}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setPaused(false);
                  if ('vibrate' in navigator) (navigator as any).vibrate?.(10);
                }}
                className="col-span-2 h-12 text-base font-semibold bg-[#00d289] hover:bg-emerald-700 rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('tech_tracker.resume')}
              </Button>
              <Button
                variant="destructive"
                onClick={endShift}
                className="col-span-1 h-12 rounded-xl"
              >
                <Square className="w-5 h-5 mr-1" />
                {t('tech_tracker.end_shift')}
              </Button>
            </>
          )}
        </div>

        {/* Error line */}
        {error && (
          <div className="px-3 pb-2 text-[12px] text-rose-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
