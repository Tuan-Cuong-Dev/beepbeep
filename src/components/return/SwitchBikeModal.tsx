'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Input } from '@/src/components/ui/input';
import { collection, getDocs, query, where, Query, DocumentData } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';

interface SwitchBikeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedBike: Vehicle) => void;
  /** companyId hoặc providerId */
  ownerId?: string;
  /** để hiển thị đúng label – nhưng truy vấn sẽ luôn hỗ trợ cả 2 field để tương thích dữ liệu cũ */
  entityType: 'rentalCompany' | 'privateProvider';
}

export default function SwitchBikeModal({
  open,
  onClose,
  onConfirm,
  ownerId,
}: SwitchBikeModalProps) {
  const { t } = useTranslation('common');
  const [selectedBike, setSelectedBike] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // reset khi mở lại
  useEffect(() => {
    if (open) {
      setSelectedBike(null);
      setSearchTerm('');
    }
  }, [open]);

  // Helper: chuyển doc -> Vehicle với default an toàn
  const toVehicle = (docId: string, data: any): Vehicle => ({
    id: docId,
    modelId: String(data.modelId ?? ''),
    companyId: String(data.companyId ?? ''),
    stationId: String(data.stationId ?? ''),
    serialNumber: String(data.serialNumber ?? ''),
    vehicleID: String(data.vehicleID ?? ''),
    plateNumber: String(data.plateNumber ?? ''),
    odo: Number(data.odo ?? 0),
    color: String(data.color ?? ''),
    status: (data.status as Vehicle['status']) ?? 'Available',
    currentLocation: String(data.currentLocation ?? ''),
    lastMaintained: data.lastMaintained ?? null,
    batteryCapacity: String(data.batteryCapacity ?? ''),
    range: Number(data.range ?? 0),
    pricePerHour: data.pricePerHour ?? undefined,
    pricePerDay: Number(data.pricePerDay ?? 0),
    pricePerWeek: data.pricePerWeek ?? undefined,
    pricePerMonth: data.pricePerMonth ?? undefined,
    note: data.note ?? undefined,
    createdAt: data.createdAt ?? undefined,
    updatedAt: data.updatedAt ?? undefined,
  });

  // Query an toàn: thử (status + owner) → nếu thiếu index thì fallback (owner) rồi lọc status ở client
  const safeFetch = async (qTry: Query<DocumentData>, qFallback: Query<DocumentData>) => {
    try {
      return await getDocs(qTry);
    } catch {
      return await getDocs(qFallback);
    }
  };

  useEffect(() => {
    const fetchAvailables = async () => {
      if (!open) return;
      if (!ownerId) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const col = collection(db, 'vehicles');

        // Nhánh companyId
        const qCompanyTry = query(col, where('status', '==', 'Available'), where('companyId', '==', ownerId));
        const qCompanyFallback = query(col, where('companyId', '==', ownerId));
        const snapC = await safeFetch(qCompanyTry, qCompanyFallback);

        // Nhánh providerId
        const qProviderTry = query(col, where('status', '==', 'Available'), where('providerId', '==', ownerId));
        const qProviderFallback = query(col, where('providerId', '==', ownerId));
        const snapP = await safeFetch(qProviderTry, qProviderFallback);

        // Gộp & lọc trùng
        const byId = new Map<string, Vehicle>();
        const push = (id: string, data: any) => {
          // nếu fallback: đảm bảo chỉ lấy xe Available
          if (data.status !== 'Available') return;
          byId.set(id, toVehicle(id, data));
        };
        snapC.forEach(d => push(d.id, d.data()));
        snapP.forEach(d => push(d.id, d.data()));

        // Lọc theo search
        const term = searchTerm.trim().toLowerCase();
        let list = Array.from(byId.values());
        if (term) {
          list = list.filter(
            v =>
              (v.vehicleID || '').toLowerCase().includes(term) ||
              (v.plateNumber || '').toLowerCase().includes(term)
          );
        }

        // Sắp xếp cho dễ nhìn
        list.sort((a, b) => (a.vehicleID || '').localeCompare(b.vehicleID || ''));

        setOptions(list);
      } catch (e) {
        console.error('fetchAvailables failed:', e);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailables();
  }, [open, ownerId, searchTerm]);

  const handleConfirm = () => {
    if (!selectedBike) return;
    onConfirm(selectedBike);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('switch_bike_modal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-2">
          <Input
            placeholder={t('switch_bike_modal.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-60 space-y-3 pr-2 mt-2">
          {loading && (
            <div className="text-sm text-gray-500 px-2">
              {t('common.loading', { defaultValue: 'Đang tải...' })}
            </div>
          )}

          {!loading && options.length === 0 && (
            <div className="text-sm text-gray-500 px-2">
              {t('switch_bike_modal.no_available', { defaultValue: 'Không có xe sẵn sàng.' })}
            </div>
          )}

          {!loading &&
            options.map((bike) => (
              <div
                key={bike.id}
                className={`border p-4 rounded-xl cursor-pointer transition-all ${
                  selectedBike?.id === bike.id ? 'border-[#00d289] bg-[#e6fff6]' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedBike(bike)}
              >
                <div className="font-semibold text-sm">
                  {bike.vehicleID} – {bike.plateNumber || t('switch_bike_modal.no_plate')}
                </div>
                <div className="text-xs text-gray-600">
                  📏 {bike.odo?.toLocaleString() || '0'} km • ⚡ {bike.batteryCapacity || '—'}Ah • 🎨 {bike.color || '—'}
                </div>
                {bike.note && <div className="text-xs text-gray-500 italic mt-1">📝 {bike.note}</div>}
              </div>
            ))}
        </ScrollArea>

        {selectedBike && (
          <div className="mt-4 p-3 border rounded-md bg-gray-50 text-sm space-y-1">
            <div>
              ✅ <strong>{selectedBike.vehicleID}</strong> – {selectedBike.plateNumber || t('switch_bike_modal.no_plate')}
            </div>
            <div>
              📏 {selectedBike.odo?.toLocaleString()} km • ⚡ {selectedBike.batteryCapacity}Ah • 🎨 {selectedBike.color || '—'}
            </div>
            {selectedBike.note && <div>📝 {selectedBike.note}</div>}
          </div>
        )}

        <div className="flex justify-end mt-6 gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('switch_bike_modal.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBike}
            className="bg-[#00d289] hover:bg-[#00b67a] text-white"
          >
            {t('switch_bike_modal.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
