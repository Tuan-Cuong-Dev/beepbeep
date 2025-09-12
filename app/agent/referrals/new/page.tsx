'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useAgentReferrals } from '@/src/hooks/useAgentReferrals';
import { useAgentOptions } from '@/src/hooks/useAgentOptions';
// OPTIONAL: nếu đã có, có thể thay bằng DateField dùng ở chỗ khác
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// giả lập: nếu bạn có hooks riêng (useAgentPrograms, useStationsNearby) thì thay vào
async function fakePhoneExists(_phone: string) { return false; }
function vnPhoneNormalize(s: string) {
  const d = s.replace(/[^\d]/g, '');
  if (d.startsWith('0')) return d;
  if (d.startsWith('84')) return '0' + d.slice(2);
  return d;
}

type FormState = {
  fullName: string;
  phone: string;
  note: string;
  companyId?: string;
  stationId?: string;
  // new fields (tùy chọn)
  expectedStart?: Date | null;
  vehicleType?: 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other';
  modelHint?: string;
  contactChannel?: 'Zalo' | 'WhatsApp' | 'Call' | 'WeChat' | 'KakaoTalk' | 'Facebook' | 'Instagram' | 'Other';
  preferredLanguage?: 'vi' | 'en' | 'ko' | 'ja' | 'zh';
  programId?: string | null;
  sourceTag?: string; // HotelLobby/Showroom/Event/Concierge/Online
  consentContact?: boolean;
};

export default function AgentReferralNewPage() {
  const { user, companyId, stationId } = useUser();
  const { create } = useAgentReferrals(user?.uid);

  // NEW: options cho company/station/model/program
  const {
    loading: optLoading,
    companyOptions,
    programOptions,
    modelOptions,
    getStationOptionsForCompany,
  } = useAgentOptions({ agentId: user?.uid || '' });

  const [tab, setTab] = useState<'share' | 'manual'>('manual');
  const [form, setForm] = useState<FormState>({
    fullName: '', phone: '', note: '',
    companyId: companyId || '', stationId: stationId || '',
    expectedStart: null, vehicleType: 'motorbike',
    contactChannel: 'Zalo', preferredLanguage: 'vi',
    programId: null, sourceTag: 'HotelLobby', consentContact: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState({ open: false, ok: true, msg: '' });
  const [dupHint, setDupHint] = useState<string | null>(null);

  const setF = (k: keyof FormState, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // ước tính hoa hồng (demo client-side)
  const commissionPreview = useMemo(() => {
    if (!form.programId) return null;
    const base = 50000; // TODO: thay bằng tính thật từ hooks/programs
    return base;
  }, [form.programId]);

  // check trùng số (nhẹ)
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setDupHint(null);
      const p = vnPhoneNormalize(form.phone || '');
      if (p.length < 9) return;
      const exists = await fakePhoneExists(p);
      if (mounted && exists) setDupHint('Số này đã tồn tại lead đang theo dõi. Vẫn có thể gửi kèm ghi chú.');
    };
    check();
    return () => { mounted = false; };
  }, [form.phone]);

  const onSubmit = async () => {
    if (!form.fullName || !form.phone) {
      setNotif({ open: true, ok: false, msg: 'Vui lòng nhập Họ tên & SĐT.' });
      return;
    }
    if (!form.consentContact) {
      setNotif({ open: true, ok: false, msg: 'Cần đồng ý cho phép liên hệ.' });
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      phone: vnPhoneNormalize(form.phone),
      expectedStart: form.expectedStart ? { seconds: Math.floor(form.expectedStart.getTime()/1000), nanoseconds: 0 } : null,
      meta: {
        byAgentId: user?.uid || null,
        preferredLanguage: form.preferredLanguage,
        sourceTag: form.sourceTag,
      }
    };
    const id = await create(payload as any);
    setSubmitting(false);
    setNotif({ open: true, ok: !!id, msg: id ? 'Tạo giới thiệu thành công!' : 'Không thể tạo giới thiệu.' });
    if (id) setForm(prev => ({ ...prev, note: '', modelHint: '' }));
  };

  // link & QR share (demo)
  const shareLink = useMemo(() => {
    const aid = user?.uid || 'agent';
    const pid = form.programId || 'default';
    return `${process.env.NEXT_PUBLIC_APP_URL || ''}/r/${aid}?program=${pid}`;
  }, [user?.uid, form.programId]);

  // Station options phụ thuộc company đã chọn
  const stationOpts = useMemo(
    () => getStationOptionsForCompany(form.companyId || ''),
    [form.companyId, getStationOptionsForCompany]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Giới thiệu khách hàng</h1>

          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            <Button variant={tab === 'manual' ? 'default' : 'outline'} onClick={() => setTab('manual')}>Nhập hộ</Button>
            <Button variant={tab === 'share' ? 'default' : 'outline'} onClick={() => setTab('share')}>Chia sẻ nhanh</Button>
          </div>

          {/* SHARE TAB */}
          {tab === 'share' && (
            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Chọn chương trình (tùy chọn)</label>
                <SimpleSelect
                  className="mt-1 h-10"
                  options={programOptions}
                  value={form.programId || ''}
                  onChange={(v) => setF('programId', v || null)}
                  placeholder={optLoading ? 'Đang tải…' : 'Chọn chương trình'}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Link giới thiệu</label>
                <div className="mt-1 flex gap-2">
                  <input readOnly className="w-full rounded border px-3 py-2" value={shareLink} />
                  <Button onClick={() => navigator.clipboard.writeText(shareLink)}>Copy</Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Gửi link này cho khách để họ tự điền thông tin; bạn vẫn được ghi nhận hoa hồng.</p>
              </div>
              {/* TODO: thêm QR component nếu cần */}
            </div>
          )}

          {/* MANUAL TAB */}
          {tab === 'manual' && (
            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Họ tên *</label>
                  <input className="mt-1 w-full rounded border px-3 py-2"
                    value={form.fullName} onChange={e => setF('fullName', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Số điện thoại *</label>
                  <input className="mt-1 w-full rounded border px-3 py-2"
                    value={form.phone} onChange={e => setF('phone', e.target.value)} />
                  {dupHint && <p className="text-xs text-amber-600 mt-1">{dupHint}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Ngày dự kiến thuê</label>
                  <DatePicker
                    selected={form.expectedStart}
                    onChange={(d: Date | null) => setF('expectedStart', d)}
                    className="mt-1 w-full rounded border px-3 py-2"
                    placeholderText="Chọn ngày"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Loại phương tiện</label>
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.vehicleType}
                    onChange={(e) => setF('vehicleType', e.target.value as FormState['vehicleType'])}
                  >
                    <option value="bike">Xe đạp</option>
                    <option value="motorbike">Xe máy / Xe máy điện</option>
                    <option value="car">Ô tô</option>
                    <option value="van">Xe van</option>
                    <option value="bus">Xe buýt</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Company → dùng options */}
                <div>
                  <label className="text-sm text-gray-600">Công ty (tùy chọn)</label>
                  <SimpleSelect
                    className="mt-1 h-10"
                    options={companyOptions}
                    value={form.companyId || ''}
                    onChange={(v) => {
                      setF('companyId', v || '');
                      // reset station khi đổi công ty
                      setF('stationId', '');
                    }}
                    placeholder={optLoading ? 'Đang tải…' : 'Chọn công ty'}
                  />
                </div>

                {/* Station phụ thuộc company đã chọn */}
                <div>
                  <label className="text-sm text-gray-600">Trạm (tùy chọn)</label>
                  <SimpleSelect
                    className="mt-1 h-10"
                    options={stationOpts}
                    value={form.stationId || ''}
                    onChange={(v) => setF('stationId', v || '')}
                    placeholder={!form.companyId ? 'Chọn công ty trước' : (optLoading ? 'Đang tải…' : 'Chọn trạm')}
                    disabled={!form.companyId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Kênh liên lạc</label>
                  <select className="mt-1 w-full rounded border px-3 py-2"
                    value={form.contactChannel}
                    onChange={e => setF('contactChannel', e.target.value as FormState['contactChannel'])}>
                    <option>Zalo</option><option>WhatsApp</option><option>Call</option>
                    <option>WeChat</option><option>KakaoTalk</option>
                    <option>Facebook</option><option>Instagram</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngôn ngữ ưu tiên</label>
                  <select className="mt-1 w-full rounded border px-3 py-2"
                    value={form.preferredLanguage}
                    onChange={e => setF('preferredLanguage', e.target.value as FormState['preferredLanguage'])}>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="ko">한국어</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              </div>

              {/* Model hint: datalist từ modelOptions */}
              <div>
                <label className="text-sm text-gray-600">Gợi ý mẫu xe (tùy chọn)</label>
                <input
                  list="agent-models"
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Chọn/nhập mẫu xe"
                  value={form.modelHint || ''}
                  onChange={(e) => setF('modelHint', e.target.value)}
                />
                <datalist id="agent-models">
                  {modelOptions.map((o) => <option key={o.value} value={o.label} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Chương trình (tùy chọn)</label>
                  <SimpleSelect
                    className="mt-1 h-10"
                    options={programOptions}
                    value={form.programId || ''}
                    onChange={(v) => setF('programId', v || null)}
                    placeholder={optLoading ? 'Đang tải…' : 'Chọn chương trình'}
                  />
                  {commissionPreview && (
                    <p className="text-xs text-emerald-700 mt-1">
                      Ước tính hoa hồng: {commissionPreview.toLocaleString('vi-VN')} VND
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Nguồn (tag)</label>
                  <input className="mt-1 w-full rounded border px-3 py-2"
                    placeholder="HotelLobby / Showroom / Event / Concierge / Online"
                    value={form.sourceTag || ''} onChange={e => setF('sourceTag', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Ghi chú</label>
                <textarea className="mt-1 w-full rounded border px-3 py-2"
                  rows={3} value={form.note} onChange={e => setF('note', e.target.value)} />
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.consentContact} onChange={e => setF('consentContact', e.target.checked)} />
                Tôi đồng ý cho phép liên hệ để xác nhận & tư vấn.
              </label>

              <div className="pt-2 flex justify-end">
                <Button onClick={onSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submitting ? 'Đang gửi…' : 'Gửi giới thiệu'}
                </Button>
              </div>
            </div>
          )}
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
