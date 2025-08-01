'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryStation, VehicleType } from '@/src/lib/batteryStations/batteryStationTypes';
import { useBatteryStations } from '@/src/hooks/useBatteryStations';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { SimpleSelect } from '@/src/components/ui/select'; // ✅ import custom Select

export default function BatteryStationEditForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { update, reload } = useBatteryStations();
  const [station, setStation] = useState<Partial<BatteryStation> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const ref = doc(db, 'batteryStations', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStation(snap.data() as BatteryStation);
      }
    };
    fetch();
  }, [id]);

  const handleChange = (field: keyof BatteryStation, value: any) => {
    setStation((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!station) return;
    setSaving(true);
    try {
      await update(id, {
        name: station.name || '',
        displayAddress: station.displayAddress || '',
        mapAddress: station.mapAddress || '',
        coordinates: station.coordinates || undefined,
        vehicleType: station.vehicleType || 'motorbike',
        isActive: station.isActive ?? true,
        updatedAt: Timestamp.now(),
      });
      await reload();
      onClose();
    } catch (err) {
      alert('❌ Lỗi khi cập nhật trạm pin.');
    } finally {
      setSaving(false);
    }
  };

  if (!station) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Tên trạm pin</Label>
        <Input
          id="name"
          value={station.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="displayAddress">Địa chỉ hiển thị</Label>
        <Input
          id="displayAddress"
          value={station.displayAddress || ''}
          onChange={(e) => handleChange('displayAddress', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="mapAddress">Địa chỉ Google Maps</Label>
        <Input
          id="mapAddress"
          value={station.mapAddress || ''}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      </div>

      <div>
        <Label>Loại phương tiện hỗ trợ</Label>
        <SimpleSelect
          value={station.vehicleType || ''}
          onChange={(val) => handleChange('vehicleType', val as VehicleType)}
          options={[
            { label: 'Xe máy điện', value: 'motorbike' },
            { label: 'Ô tô điện', value: 'car' },
          ]}
          placeholder="Chọn loại phương tiện"
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <Label htmlFor="isActive">Đang hoạt động</Label>
        <Switch
          id="isActive"
          checked={station.isActive ?? true}
          onCheckedChange={(value) => handleChange('isActive', value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>
    </div>
  );
}
