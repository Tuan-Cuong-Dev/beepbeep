//Agent -  Giới thiệu khách hàng và lịch sử hoa hồng

'use client';

import { useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useAgentReferrals } from '@/src/hooks/useAgentReferrals';

export default function AgentReferralNewPage() {
  const { user, companyId, stationId } = useUser();
  const { create } = useAgentReferrals(user?.uid);
  const [form, setForm] = useState({ fullName: '', phone: '', note: '', companyId: companyId || '', stationId: stationId || '' });
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState({ open: false, ok: true, msg: '' });

  const setF = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const onSubmit = async () => {
    if (!form.fullName || !form.phone) {
      setNotif({ open: true, ok: false, msg: 'Vui lòng nhập Họ tên & SĐT.' }); return;
    }
    setSubmitting(true);
    const id = await create(form);
    setSubmitting(false);
    setNotif({ open: true, ok: !!id, msg: id ? 'Tạo giới thiệu thành công!' : 'Không thể tạo giới thiệu.' });
    if (id) setForm({ ...form, note: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Giới thiệu khách hàng</h1>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <div>
              <label className="text-sm text-gray-600">Họ tên *</label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={form.fullName} onChange={e => setF('fullName', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Số điện thoại *</label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={form.phone} onChange={e => setF('phone', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Công ty (tùy chọn)</label>
                <input className="mt-1 w-full rounded border px-3 py-2" value={form.companyId} onChange={e => setF('companyId', e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Trạm (tùy chọn)</label>
                <input className="mt-1 w-full rounded border px-3 py-2" value={form.stationId} onChange={e => setF('stationId', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ghi chú</label>
              <textarea className="mt-1 w-full rounded border px-3 py-2" rows={3} value={form.note} onChange={e => setF('note', e.target.value)} />
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={onSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting ? 'Đang gửi…' : 'Gửi giới thiệu'}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <NotificationDialog
        open={notif.open}
        onClose={() => setNotif({ ...notif, open: false })}
        type={notif.ok ? 'success' : 'error'}
        title={notif.ok ? 'Thành công' : 'Lỗi'}
        description={notif.msg}
      />
    </div>
  );
}
