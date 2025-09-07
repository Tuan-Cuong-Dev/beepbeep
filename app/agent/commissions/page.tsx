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

import { PiggyBank, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';

const DEFAULT_TOTALS = { pending: 0, approved: 0, paid: 0 } as const;

export default function AgentCommissionPage() {
  const { user } = useUser();
  const agentId = user?.uid ?? '';

  const { listCommissionByAgent } = useCommissionHistory();

  const [items, setItems] = React.useState<CommissionEntry[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<unknown>(null);

  const reload = React.useCallback(async () => {
    if (!agentId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listCommissionByAgent(agentId, 100);
      setItems(rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [agentId, listCommissionByAgent]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/60 to-white">
      <Header />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-6 pb-2">
          {/* Hero */}
          <div className="rounded-2xl bg-white shadow-sm border p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hoa hồng cộng tác viên
              </h1>
              <p className="text-gray-600 mt-1">
                Xin chào{user?.name ? `, ${user.name}` : ''}! Dưới đây là tổng quan hoa hồng được tính theo từng đơn.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <StatCard
              title="Đang chờ"
              value={totals.pending}
              icon={<Clock3 className="h-5 w-5" />}
              hint="Hoa hồng chờ duyệt"
              tone="amber"
            />
            <StatCard
              title="Đã duyệt"
              value={totals.approved}
              icon={<CheckCircle2 className="h-5 w-5" />}
              hint="Sẽ được trả trong kỳ"
              tone="blue"
            />
            <StatCard
              title="Đã trả"
              value={totals.paid}
              icon={<PiggyBank className="h-5 w-5" />}
              hint="Đã thanh toán"
              tone="emerald"
            />
          </div>

          {/* Content */}
          <div className="mt-6">
            {(!agentId) && (
              <div className="rounded-xl bg-white border p-6 text-gray-700">
                Vui lòng đăng nhập để xem hoa hồng cộng tác viên.
              </div>
            )}

            {agentId && (
              <>
                {loading && (
                  <div className="rounded-xl bg-white border p-6 text-gray-700">
                    Đang tải…
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl bg-white border p-6 text-red-600">
                    Lỗi: {String(error)}
                  </div>
                )}

                {!loading && !error && (
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <div className="rounded-xl bg-white border p-10 text-center text-gray-500">
                        Chưa có hoa hồng nào.
                      </div>
                    ) : (
                      items.map((it) => <EntryCard key={it.id} entry={it} />)
                    )}
                  </div>
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

/* ============= UI pieces ============= */

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
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  }[tone];

  return (
    <div className="rounded-2xl border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${toneMap.bg} ${toneMap.text}`}>
          <span className={`inline-block h-2 w-2 rounded-full ${toneMap.dot}`} />
          {title}
        </div>
        <div className={`rounded-full p-2 ${toneMap.bg} ${toneMap.text}`}>{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold">
        {formatCurrency(value ?? 0)}
      </div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}

function EntryCard({ entry }: { entry: CommissionEntry }) {
  return (
    <div className="rounded-2xl bg-white border shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left */}
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-gray-500">Booking:</span>{' '}
            <span className="font-medium">{entry.bookingId}</span>
          </div>
          <div className="text-gray-600">
            Chương trình: {entry.agentProgramId ?? '—'}
          </div>
          <div className="text-gray-600">
            Tính lúc: {safeFormatDate(entry.computedAt, 'dd/MM/yyyy HH:mm')}
          </div>
        </div>

        {/* Right */}
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-600">
            {formatCurrency(entry.amount ?? 0)}
          </div>
          <StatusBadge status={entry.status} />
        </div>
      </div>

      {/* Snapshot */}
      {entry.snapshot && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-gray-600">
          {'totalAmount' in entry.snapshot && (
            <Info kv="Tổng đơn" val={formatCurrency(entry.snapshot.totalAmount ?? 0)} />
          )}
          {'basePrice' in entry.snapshot && (
            <Info kv="Giá/ngày" val={formatCurrency(entry.snapshot.basePrice ?? 0)} />
          )}
          {'rentalDays' in entry.snapshot && (
            <Info kv="Số ngày" val={String(entry.snapshot.rentalDays ?? 0)} />
          )}
          {'batteryFee' in entry.snapshot && (
            <Info kv="Phí pin" val={formatCurrency(entry.snapshot.batteryFee ?? 0)} />
          )}
          {'deposit' in entry.snapshot && (
            <Info kv="Đặt cọc" val={formatCurrency(entry.snapshot.deposit ?? 0)} />
          )}
        </div>
      )}
    </div>
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
  const color =
    status === 'paid'
      ? 'bg-green-100 text-green-700'
      : status === 'approved'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700';
  const text =
    status === 'paid' ? 'Đã trả' : status === 'approved' ? 'Đã duyệt' : 'Đang chờ';
  return (
    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${color}`}>
      {text}
    </span>
  );
}
