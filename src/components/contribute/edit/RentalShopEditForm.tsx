'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';

export default function RentalShopEditForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [station, setStation] = useState<Partial<RentalStation> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const ref = doc(db, 'rentalStations', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStation(snap.data() as RentalStation);
      }
    };
    fetch();
  }, [id]);

  const handleChange = (field: keyof RentalStation, value: any) => {
    setStation((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!station) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'rentalStations', id), {
        name: station.name || '',
        displayAddress: station.displayAddress || '',
        mapAddress: station.mapAddress || '',
        location: station.location || '',
        updatedAt: Timestamp.now(),
      });
      onClose();
    } catch (err) {
      alert('❌ Lỗi khi cập nhật điểm cho thuê.');
    } finally {
      setSaving(false);
    }
  };

  if (!station) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Tên trạm cho thuê</Label>
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
        <Label htmlFor="location">Tọa độ (vd: 16.0226° N, 108.1207° E)</Label>
        <Input
          id="location"
          value={station.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
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
