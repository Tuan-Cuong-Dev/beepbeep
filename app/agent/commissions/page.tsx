'use client';

import * as React from 'react';
import { useUser } from '@/src/context/AuthContext';
import {
  useCommissionHistory,
  type CommissionEntry,
  type CommissionStatus,
} from '@/src/hooks/useCommissionHistory';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { formatCurrency } from '@/src/utils/formatCurrency';

import {
  PiggyBank,
  CheckCircle2,
  Clock3,
  RefreshCw,
  BadgeInfo,
} from 'lucide-react';

import type {
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';

/* =========================================================
   Utilities
========================================================= */
const DEFAULT_TOTALS = { pending: 0, approved: 0, paid: 0 } as const;
const PAGE_SIZE = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

/* =========================================================
   Component
========================================================= */
export default function AgentCommissionPage() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const agentId = user?.uid ?? '';

  const { listCommissionByAgent } = useCommissionHistory();

  const [items, setItems] = React.useState<CommissionEntry[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<unknown>(null);
  const [cursor, setCursor] = React.useState<
    QueryDocumentSnapshot<DocumentData> | undefined
  >(undefined);
  const [hasMore, setHasMore] = React.useState<boolean>(false);

  // id -> program name
  const [programNames, setProgramNames] = React.useState<Record<string, string>>({});
  const [progLoading, setProgLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!agentId) {
      setItems([]);
      setCursor(undefined);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { items: rows, lastDoc, hasMore } = await listCommissionByAgent(agentId, {
        take: PAGE_SIZE,
      });
      setItems(rows);
      setCursor(lastDoc);
      setHasMore(hasMore);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [agentId, listCommissionByAgent]);

  const loadMore = React.useCallback(async () => {
    if (!agentId || !cursor) return;
    setLoading(true);
    setError(null);
    try {
      const { items: rows, lastDoc, hasMore } = await listCommissionByAgent(agentId, {
        take: PAGE_SIZE,
        after: cursor,
      });
      setItems((prev) => [...prev, ...rows]);
      setCursor(lastDoc);
      setHasMore(hasMore);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [agentId, cursor, listCommissionByAgent]);

  // initial load
  React.useEffect(() => {
    void reload();
  }, [reload]);

  // derive totals
  const totals = React.useMemo(() => {
    const acc = { ...DEFAULT_TOTALS };
    for (const it of items) {
      const amt = Number(it?.amount ?? 0);
      if (it?.status === 'pending') acc.pending += amt;
      else if (it?.status === 'approved') acc.approved += amt;
      else if (it?.status === 'paid') acc.paid += amt;
    }
    return acc;
  }, [items]);

  // Load program names for visible entries (batch by 10 for documentId "in")
  React.useEffect(() => {
    const ids = Array.from(
      new Set(
        items
          .map((it) => it.agentProgramId)
          .filter((v): v is string => Boolean(v))
      )
    );
    if (ids.length === 0) return;

    // Only fetch missing ids
    const missing = ids.filter((id) => !(id in programNames));
    if (missing.length === 0) return;

    setProgLoading(true);

    const fetchNames = async () => {
      const newMap: Record<string, string> = {};

      const pull = async (colPath: string, wanted: string[]) => {
        for (const group of chunk(wanted, 10)) {
          const qRef = query(
            collection(db, colPath),
            where(documentId(), 'in', group)
          );
          const snap = await getDocs(qRef);
          snap.forEach((doc) => {
            const data = doc.data() as any;
            const name =
              data?.name || data?.title || data?.programName || doc.id;
            newMap[doc.id] = name;
          });
        }
      };

      const wanted = [...missing];
      await pull('agentPrograms', wanted);

      const stillMissing = wanted.filter((id) => !(id in newMap));
      if (stillMissing.length) {
        await pull('programs', stillMissing);
      }

      setProgramNames((prev) => ({ ...prev, ...newMap }));
      setProgLoading(false);
    };

    void fetchNames();
  }, [items, programNames]);

  const greeting = user?.name
    ? t('agent_commission.greeting_named', { name: user.name })
    : t('agent_commission.greeting_generic');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/60 to-white">
      <Header />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 pt-6 pb-2">
          {/* Hero */}
          <div className="rounded-2xl bg-white shadow-sm border p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('agent_commission.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {greeting}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reload} className="gap-2">
                <RefreshCw className="h-4 w-4" /> {t('agent_commission.reload')}
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
            <StatCard
              title={t('agent_commission.stats.pending.title')}
              value={totals.pending}
              icon={<Clock3 className="h-5 w-5" />}
              hint={t('agent_commission.stats.pending.hint')}
              tone="amber"
            />
            <StatCard
              title={t('agent_commission.stats.approved.title')}
              value={totals.approved}
              icon={<CheckCircle2 className="h-5 w-5" />}
              hint={t('agent_commission.stats.approved.hint')}
              tone="blue"
            />
            <StatCard
              title={t('agent_commission.stats.paid.title')}
              value={totals.paid}
              icon={<PiggyBank className="h-5 w-5" />}
              hint={t('agent_commission.stats.paid.hint')}
              tone="emerald"
            />
          </div>

          {/* Content */}
          <div className="mt-6">
            {!agentId && (
              <div className="rounded-xl bg-white border p-6 text-gray-700">
                {t('agent_commission.login_required')}
              </div>
            )}

            {agentId && (
              <>
                {loading && items.length === 0 && (
                  <div className="rounded-xl bg-white border p-6 text-gray-700">
                    {t('loading')}
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl bg-white border p-6 text-red-600">
                    {t('error')}: {String(error)}
                  </div>
                )}

                {!loading && !error && (
                  <>
                    <div className="space-y-3">
                      {items.length === 0 ? (
                        <div className="rounded-xl bg-white border p-10 text-center text-gray-500">
                          {t('agent_commission.empty')}
                        </div>
                      ) : (
                        items.map((it) => (
                          <EntryCard
                            key={it.id}
                            entry={it}
                            programName={
                              it.agentProgramId
                                ? programNames[it.agentProgramId]
                                : undefined
                            }
                            progLoading={progLoading}
                          />
                        ))
                      )}
                    </div>

                    {hasMore && (
                      <div className="flex justify-center mt-4">
                        <Button
                          onClick={loadMore}
                          disabled={loading}
                          variant="outline"
                          className="min-w-[160px]"
                        >
                          {loading ? t('loading') : t('agent_commission.load_more')}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   UI Subcomponents
========================================================= */
function StatCard({
  title,
  value,
  icon,
  hint,
  tone = 'emerald',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  hint?: string;
  tone?: 'emerald' | 'blue' | 'amber';
}) {
  const toneMap = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
  }[tone];

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${toneMap.bg} ${toneMap.text}`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${toneMap.dot}`} />
          {title}
        </div>
        <div className={`rounded-full p-2 ${toneMap.bg} ${toneMap.text}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold">
        {formatCurrency(value ?? 0)}
      </div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}

function EntryCard({
  entry,
  programName,
  progLoading,
}: {
  entry: CommissionEntry;
  programName?: string;
  progLoading?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="rounded-2xl bg-white border shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500">{t('agent_commission.booking_label')}</span>
            <span className="font-medium">{entry.bookingId}</span>
            <ProgramBadge
              name={programName}
              isLoading={
                !!(progLoading && entry.agentProgramId && !programName)
              }
            />
          </div>
          <div className="text-gray-600">
            {t('agent_commission.computed_at_label')}{' '}
            {safeFormatDate(entry.computedAt, 'dd/MM/yyyy HH:mm')}
          </div>
          {entry.snapshot && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-gray-600">
              {'totalAmount' in entry.snapshot && (
                <Info
                  kv={t('agent_commission.snapshot.total_amount')}
                  val={formatCurrency(entry.snapshot.totalAmount ?? 0)}
                />
              )}
              {'basePrice' in entry.snapshot && (
                <Info
                  kv={t('agent_commission.snapshot.base_price')}
                  val={formatCurrency(entry.snapshot.basePrice ?? 0)}
                />
              )}
              {'rentalDays' in entry.snapshot && (
                <Info
                  kv={t('agent_commission.snapshot.rental_days')}
                  val={String(entry.snapshot.rentalDays ?? 0)}
                />
              )}
              {'batteryFee' in entry.snapshot && (
                <Info
                  kv={t('agent_commission.snapshot.battery_fee')}
                  val={formatCurrency(entry.snapshot.batteryFee ?? 0)}
                />
              )}
              {'deposit' in entry.snapshot && (
                <Info
                  kv={t('agent_commission.snapshot.deposit')}
                  val={formatCurrency(entry.snapshot.deposit ?? 0)}
                />
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="text-right min-w-[180px]">
          <div className="text-lg font-semibold text-emerald-600">
            {formatCurrency(entry.amount ?? 0)}
          </div>
          <StatusBadge status={entry.status} />
        </div>
      </div>
    </div>
  );
}

function ProgramBadge({
  name,
  isLoading,
}: {
  name?: string;
  isLoading?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-xs">
      <BadgeInfo className="h-3.5 w-3.5" />
      {isLoading ? t('agent_commission.program_loading') : (name || t('agent_commission.no_program'))}
    </span>
  );
}

function Info({ kv, val }: { kv: string; val: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border px-2 py-1 flex items-center justify-between">
      <span className="text-gray-500">{kv}</span>
      <span className="font-medium text-gray-800">{val}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CommissionStatus }) {
  const { t } = useTranslation('common');
  const color =
    status === 'paid'
      ? 'bg-green-100 text-green-700'
      : status === 'approved'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700';

  const text =
    status === 'paid'
      ? t('agent_commission.status.paid')
      : status === 'approved'
      ? t('agent_commission.status.approved')
      : t('agent_commission.status.pending');

  return (
    <span
      className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${color}`}
    >
      {text}
    </span>
  );
}
