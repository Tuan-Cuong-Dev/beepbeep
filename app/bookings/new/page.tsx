'use client';

import * as React from 'react';
import Image from 'next/image';
// ❌ bỏ useSearchParams
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useBookingForm } from '@/src/hooks/useBookingForm';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { formatCurrency } from '@/src/utils/formatCurrency';

type AnyRec = Record<string, any>;

function getDirectDriveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = m1?.[1] || m2?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
}

// 👉 Resolve tên đơn vị từ companyId (ưu tiên rentalCompanies, fallback privateProviders)
async function resolveCompanyName(companyId: string): Promise<string> {
  if (!companyId) return '';
  const tryRefs = [
    doc(db, 'rentalCompanies', companyId),
    doc(db, 'privateProviders', companyId),
  ];
  for (const ref of tryRefs) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data() as AnyRec;
      return d.name || d.title || d.displayName || companyId;
    }
  }
  return companyId;
}

type Qs = {
  modelId: string;
  companyId: string;
  stationId: string;
  vehicleId: string;
  basePricePerDay: string | null;
};

export default function BookingNewPage() {
  const router = useRouter();

  // 🔒 Đọc query client-side để không cản trở static export
  const [qs, setQs] = React.useState<Qs | null>(null);
  React.useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      setQs({
        modelId: sp.get('modelId') ?? '',
        companyId: sp.get('companyId') ?? '',
        stationId: sp.get('stationId') ?? '',
        vehicleId: sp.get('vehicleId') ?? '',
        basePricePerDay: sp.get('basePricePerDay'),
      });
    } catch {
      setQs({ modelId: '', companyId: '', stationId: '', vehicleId: '', basePricePerDay: null });
    }
  }, []);

  // Auth
  const { user } = useUser();
  const userId = user?.uid || '';

  // Dùng companyId từ qs (ban đầu rỗng, hook sẽ tự cập nhật khi qs có giá trị)
  const companyId = qs?.companyId ?? '';
  const modelId = qs?.modelId ?? '';
  const stationIdQ = qs?.stationId ?? '';
  const vehicleIdQ = qs?.vehicleId ?? '';
  const basePricePerDayQ = qs?.basePricePerDay ?? null;

  // Hook booking (tự tính endDate/total/remaining bên trong)
  const { formData, setFormData, stations, stationsLoading, handleSubmit } = useBookingForm(companyId, userId);

  // Meta hiển thị
  const [modelMeta, setModelMeta] = React.useState<{ name: string; imageUrl?: string } | null>(null);
  const [vehicleMeta, setVehicleMeta] = React.useState<{ vehicleID?: string; licensePlate?: string; color?: string } | null>(null);

  const [companyName, setCompanyName] = React.useState<string>('');
  const [companyLoading, setCompanyLoading] = React.useState<boolean>(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ open: boolean; ok?: boolean; msg?: string }>({ open: false });

  // 📌 Load tên công ty/nhà cung cấp từ companyId
  React.useEffect(() => {
    let active = true;
    if (!companyId) return;
    (async () => {
      try {
        setCompanyLoading(true);
        const name = await resolveCompanyName(companyId);
        if (active) setCompanyName(name);
      } finally {
        if (active) setCompanyLoading(false);
      }
    })();
    return () => { active = false; };
  }, [companyId]);

  // Prefill: model/vehicle meta
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (modelId) {
          const ms = await getDoc(doc(db, 'vehicleModels', modelId));
          if (ms.exists() && mounted) {
            const d = ms.data() as AnyRec;
            setModelMeta({
              name: d.name || modelId,
              imageUrl: getDirectDriveImageUrl(d.imageUrl) || d.imageUrl,
            });
            setFormData((prev: AnyRec) => ({ ...prev, vehicleModel: d.name || modelId }));
          }
        }
        if (vehicleIdQ) {
          const vs = await getDoc(doc(db, 'vehicles', vehicleIdQ));
          if (vs.exists() && mounted) {
            const v = vs.data() as AnyRec;
            setVehicleMeta({ vehicleID: v.vehicleID, licensePlate: v.plateNumber, color: v.color });
            setFormData((prev: AnyRec) => ({
              ...prev,
              vin: v.vehicleID || '',
              licensePlate: v.plateNumber || '',
              vehicleColor: v.color || '',
            }));
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [modelId, vehicleIdQ, setFormData]);

  // Prefill: stationId + basePrice
  React.useEffect(() => {
    if (!qs) return; // chờ query
    const basePrice = basePricePerDayQ ? Number(basePricePerDayQ) : undefined;
    setFormData((prev: AnyRec) => ({
      ...prev,
      stationId: stationIdQ || prev.stationId || '',
      basePrice: typeof basePrice === 'number' && !Number.isNaN(basePrice) ? basePrice : prev.basePrice ?? 0,
    }));
  }, [qs, stationIdQ, basePricePerDayQ, setFormData]);

  // Helpers
  const setF = (k: string, v: any) => setFormData((prev: AnyRec) => ({ ...prev, [k]: v }));
  const imgSrc = modelMeta?.imageUrl ? modelMeta.imageUrl : '/no-image.png';

  const onSubmit = async () => {
    setSubmitting(true);
    const res = await handleSubmit();
    setSubmitting(false);
    if (res.status === 'success') {
      setNotice({ open: true, ok: true, msg: 'Đặt xe thành công!' });
      router.push('/bookings');
    } else if (res.status === 'validation_error') {
      setNotice({ open: true, ok: false, msg: 'Thiếu dữ liệu: Ngày/giờ bắt đầu và số ngày thuê.' });
    } else {
      setNotice({ open: true, ok: false, msg: 'Có lỗi trong quá trình đặt xe.' });
    }
  };

  // ⏳ Chờ đọc query xong rồi mới kiểm tra thiếu tham số
  if (!qs) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto p-4">
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">Đang tải…</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!companyId || !modelId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto p-4">
          <div className="rounded-lg border bg-white p-4 text-sm text-red-600">
            Thiếu tham số: <code>companyId</code> hoặc <code>modelId</code>. Hãy quay lại danh sách và bấm “Đặt xe”.
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto p-4">
          {/* Header page */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Đặt xe</h1>
            <p className="text-sm text-gray-500">
              Công ty:{' '}
              <span className="font-medium">
                {companyLoading ? 'Đang tải…' : companyName || companyId}
              </span>
            </p>
          </div>

          {/* Top: Model card */}
          <div className="bg-white rounded-2xl shadow overflow-hidden md:flex">
            <div className="relative w-full md:w-1/2 h-[240px] md:h-[320px] border-b md:border-b-0 md:border-r">
              <Image src={imgSrc} alt={modelMeta?.name || modelId} fill className="object-contain p-4 bg-white" />
            </div>
            <div className="p-4 md:w-1/2">
              <h2 className="text-xl font-semibold">{modelMeta?.name || '—'}</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div><span className="text-gray-500">VIN:</span> {vehicleMeta?.vehicleID || '—'}</div>
                <div><span className="text-gray-500">Biển số:</span> {vehicleMeta?.licensePlate || '—'}</div>
                <div><span className="text-gray-500">Màu:</span> {vehicleMeta?.color || '—'}</div>
                <div>
                  <span className="text-gray-500">Giá gốc/ngày:</span>{' '}
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(formData?.basePrice || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="mt-4 bg-white rounded-2xl shadow p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Thông tin KH */}
              <section>
                <h3 className="font-semibold mb-2">Thông tin khách thuê</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Họ tên</label>
                    <input className="mt-1 w-full rounded border px-3 py-2" value={formData?.fullName || ''} onChange={(e) => setF('fullName', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">SĐT</label>
                      <input className="mt-1 w-full rounded border px-3 py-2" value={formData?.phone || ''} onChange={(e) => setF('phone', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">CCCD/CMND</label>
                      <input className="mt-1 w-full rounded border px-3 py-2" value={formData?.idNumber || ''} onChange={(e) => setF('idNumber', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Địa chỉ</label>
                    <input className="mt-1 w-full rounded border px-3 py-2" value={formData?.address || ''} onChange={(e) => setF('address', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Thông tin thuê */}
              <section>
                <h3 className="font-semibold mb-2">Thông tin thuê</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Ngày bắt đầu</label>
                      <input type="date" className="mt-1 w-full rounded border px-3 py-2" value={formData?.rentalStartDate || ''} onChange={(e) => setF('rentalStartDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Giờ bắt đầu</label>
                      <input type="time" className="mt-1 w-full rounded border px-3 py-2" value={formData?.rentalStartHour || ''} onChange={(e) => setF('rentalStartHour', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Số ngày thuê</label>
                      <input type="number" min={1} className="mt-1 w-full rounded border px-3 py-2" value={formData?.rentalDays ?? 1} onChange={(e) => setF('rentalDays', Number(e.target.value || 0))} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Ngày trả (tự tính)</label>
                      <input readOnly className="mt-1 w-full rounded border px-3 py-2 bg-gray-50" value={formData?.rentalEndDate ? new Date(formData.rentalEndDate).toLocaleString() : ''} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Trạm nhận xe</label>
                      <select className="mt-1 w-full rounded border px-3 py-2" disabled={stationsLoading} value={formData?.stationId || ''} onChange={(e) => setF('stationId', e.target.value)}>
                        <option value="">{stationsLoading ? 'Đang tải…' : '— Chọn trạm —'}</option>
                        {stations?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name || s.id}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Hình thức giao nhận</label>
                      <select className="mt-1 w-full rounded border px-3 py-2" value={formData?.deliveryMethod || 'Pickup at Shop'} onChange={(e) => setF('deliveryMethod', e.target.value)}>
                        <option value="Pickup at Shop">Nhận tại cửa hàng</option>
                        <option value="Deliver to Address">Giao đến địa chỉ</option>
                      </select>
                    </div>
                  </div>

                  {formData?.deliveryMethod === 'Deliver to Address' && (
                    <div>
                      <label className="text-sm text-gray-600">Địa chỉ giao</label>
                      <input className="mt-1 w-full rounded border px-3 py-2" value={formData?.deliveryAddress || ''} onChange={(e) => setF('deliveryAddress', e.target.value)} />
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Giá & phụ phí */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <section>
                <h3 className="font-semibold mb-2">Giá & cọc</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Giá/ngày (gốc)</label>
                    <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={formData?.basePrice ?? 0} onChange={(e) => setF('basePrice', Number(e.target.value || 0))} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phí pin</label>
                    <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={formData?.batteryFee ?? 0} onChange={(e) => setF('batteryFee', Number(e.target.value || 0))} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Tổng tiền</label>
                    <input readOnly className="mt-1 w-full rounded border px-3 py-2 bg-gray-50" value={formData?.totalAmount ?? 0} />
                    <div className="text-xs text-gray-500 mt-1">{formatCurrency(formData?.totalAmount ?? 0)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Đặt cọc</label>
                    <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={formData?.deposit ?? 0} onChange={(e) => setF('deposit', Number(e.target.value || 0))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Còn lại</label>
                    <input readOnly className="mt-1 w-full rounded border px-3 py-2 bg-gray-50" value={formData?.remainingBalance ?? 0} />
                    <div className="text-xs text-gray-500 mt-1">{formatCurrency(formData?.remainingBalance ?? 0)}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Phụ kiện</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(['helmet','charger','phoneHolder','rearRack','raincoat'] as const).map((k) => (
                    <label key={k} className="inline-flex items-center gap-2">
                      <input type="checkbox" className="rounded border" checked={!!(formData as any)?.[k]} onChange={(e) => setF(k, e.target.checked)} />
                      <span>
                        {k === 'helmet' ? 'Nón bảo hiểm'
                          : k === 'charger' ? 'Sạc'
                          : k === 'phoneHolder' ? 'Giá đỡ điện thoại'
                          : k === 'rearRack' ? 'Baga sau'
                          : 'Áo mưa'}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-sm text-gray-600">Ghi chú</label>
                  <textarea className="mt-1 w-full rounded border px-3 py-2" rows={3} value={formData?.note || ''} onChange={(e) => setF('note', e.target.value)} />
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Trạng thái: <span className="font-medium">{formData?.bookingStatus || 'draft'}</span>
              </div>
              <Button
                onClick={onSubmit}
                disabled={submitting || !formData?.rentalStartDate || !formData?.rentalStartHour || !formData?.rentalDays}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? 'Đang tạo…' : 'Tạo booking'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={notice.open}
        onClose={() => setNotice({ open: false })}
        type={notice.ok ? 'success' : 'error'}
        title={notice.ok ? 'Thành công' : 'Lỗi'}
        description={notice.msg || ''}
      />
    </div>
  );
}
