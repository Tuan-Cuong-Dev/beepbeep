// src/components/techinicianPartner/MobileStickyTrackerBar.tsx
'use client';

import { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Square, Satellite, ShieldCheck } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useTechLivePublisher } from '@/src/hooks/useTechLivePublisher';
import { db } from '@/src/firebaseConfig';
import { COLLECTIONS } from '@/src/lib/tracking/collections';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLocalStorageState } from '@/src/hooks/useLocalStorageState';
import { isMobileTechnician } from '@/src/utils/isMobileTechnician';
import type { User } from '@/src/lib/users/userTypes';

type TrackerPersist = { enabled: boolean; paused: boolean; sessionId: string | null };
const lsKey = (techId: string) => `bb.tracker.${techId || 'anon'}`;

export default function MobileStickyTrackerBar({
  className = '',
  user,                                  // ✅ nhận user đã gộp
}: {
  className?: string;
  user: Partial<User> | null | undefined;
}) {
  if (!user) return null;
  const allowed = isMobileTechnician(user);
  if (!allowed) return null;
  return <Inner key={(user as any)?.uid} className={className} user={user} />;
}

function Inner({
  className = '',
  user,
}: {
  className?: string;
  user: Partial<User>;
}) {
  const { t } = useTranslation('common');
  const techId = String((user as any)?.uid || '');

  const [persist, setPersist] = useLocalStorageState<TrackerPersist>(lsKey(techId), {
    enabled: false,
    paused: false,
    sessionId: null,
  });

  useEffect(() => {
    if (!techId) return;
    const anon = localStorage.getItem(lsKey('anon'));
    if (anon && !localStorage.getItem(lsKey(techId))) {
      localStorage.setItem(lsKey(techId), anon);
      localStorage.removeItem(lsKey('anon'));
      try {
        setPersist(JSON.parse(anon) as TrackerPersist);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techId]);

  const { error } = useTechLivePublisher({
    techId,
    name: (user as any)?.name,
    companyName: (user as any)?.companyName,
    sessionId: persist.sessionId || 'no-session',
    enabled: persist.enabled && !persist.paused && !!persist.sessionId,
  });

  const goOnline = async () => {
    if (!techId) return;
    const sid = uuid();

    await setDoc(doc(db, COLLECTIONS.sessions(techId), sid), {
      sessionId: sid,
      techId,
      startedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, COLLECTIONS.presence, techId), {
      status: 'online',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    setPersist({ enabled: true, paused: false, sessionId: sid });
    (navigator as any)?.vibrate?.(15);
  };

  const pause = () => {
    setPersist(prev => ({ ...prev, paused: true }));
    (navigator as any)?.vibrate?.(10);
  };

  const resume = () => {
    setPersist(prev => ({ ...prev, paused: false }));
    (navigator as any)?.vibrate?.(10);
  };

  const endShift = async () => {
    if (!techId) return;
    const { sessionId } = persist;
    if (sessionId) {
      await setDoc(doc(db, COLLECTIONS.sessions(techId), sessionId), {
        endedAt: serverTimestamp(),
      }, { merge: true });
    }
    await setDoc(doc(db, COLLECTIONS.presence, techId), {
      status: 'offline',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    setPersist({ enabled: false, paused: false, sessionId: null });
    (navigator as any)?.vibrate?.([10, 30, 10]);
  };

  return (
    <div className={['fixed inset-x-0 bottom-0 z-50 pb-[calc(env(safe-area-inset-bottom,0)+12px)] px-3', className].join(' ')}>
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-lg dark:border-gray-800 dark:bg-neutral-900/80">
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
                {(user as any)?.name || 'Technician'} · {persist.enabled ? (persist.paused ? t('tech_tracker.status_paused') : t('tech_tracker.status_online')) : 'Offline'}
              </p>
            </div>
          </div>
          <div className="hidden xs:block text-[11px] text-gray-500 dark:text-gray-400">
            <ShieldCheck className="inline w-3.5 h-3.5 mr-1" />
            {persist.enabled && persist.sessionId ? `#${persist.sessionId.slice(0, 6)}` : '—'}
          </div>
        </div>

        <div className="p-3 grid grid-cols-3 gap-2">
          {!persist.enabled ? (
            <Button onClick={goOnline} className="col-span-3 h-12 text-base font-semibold bg-[#00d289] hover:bg-emerald-700 rounded-xl">
              <Play className="w-5 h-5 mr-2" />
              {t('tech_tracker.go_online')}
            </Button>
          ) : !persist.paused ? (
            <>
              <Button variant="secondary" onClick={pause} className="col-span-1 h-12 rounded-xl">
                <Pause className="w-5 h-5 mr-1" />
                {t('tech_tracker.pause')}
              </Button>
              <Button variant="destructive" onClick={endShift} className="col-span-2 h-12 rounded-xl">
                <Square className="w-5 h-5 mr-1" />
                {t('tech_tracker.end_shift')}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={resume} className="col-span-2 h-12 text-base font-semibold bg-[#00d289] hover:bg-emerald-700 rounded-xl">
                <Play className="w-5 h-5 mr-2" />
                {t('tech_tracker.resume')}
              </Button>
              <Button variant="destructive" onClick={endShift} className="col-span-1 h-12 rounded-xl">
                <Square className="w-5 h-5 mr-1" />
                {t('tech_tracker.end_shift')}
              </Button>
            </>
          )}
        </div>

        <div className="px-3 pb-3">
          <p className="w-full text-center text-[11px] leading-tight text-gray-600 dark:text-gray-300">
            {t('tech_tracker_hint')}
          </p>
        </div>

        {error && <div className="px-3 pb-2 text-[12px] text-rose-600">{error}</div>}
      </div>
    </div>
  );
}
