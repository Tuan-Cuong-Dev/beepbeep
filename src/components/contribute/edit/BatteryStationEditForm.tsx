'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import type { BatteryStation, VehicleType } from '@/src/lib/batteryStations/batteryStationTypes';
import { useBatteryStations } from '@/src/hooks/useBatteryStations';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { SimpleSelect } from '@/src/components/ui/select';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

/* ============ Helpers ============ */

type LatLng = { lat: number; lng: number };

// nhận "16.07, 108.22" hoặc "16.07° N, 108.22° E"
const parseLatLngPair = (s?: string): LatLng | null => {
  if (!s) return null;
  const m = s.match(/(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

// lấy lat,lng từ URL Google Maps: @lat,lng hoặc ?q/query/ll=lat,lng
const extractLatLngFromGMapUrl = (url?: string): LatLng | null => {
  if (!url) return null;
  try {
    const at = url.match(/@(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
    if (at) {
      const lat = parseFloat(at[1]);
      const lng = parseFloat(at[3]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    const u = new URL(url);
    for (const k of ['q', 'query', 'll']) {
      const v = u.searchParams.get(k) || '';
      const m = v.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[3]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch {}
  return null;
};

/* ============ Component ============ */

export default function BatteryStationEditForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { update, reload } = useBatteryStations();
  const { coords, geocode } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;

  // state chính + state nội bộ cho 1 ô tọa độ duy nhất
  const [station, setStation] = useState<(Partial<BatteryStation> & { _lat?: string; _lng?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  // fetch on mount
  useEffect(() => {
    (async () => {
      const ref = doc(db, 'batteryStations', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data() as BatteryStation;

      setStation({
        ...data,
        _lat: data.coordinates ? String(data.coordinates.lat) : '',
        _lng: data.coordinates ? String(data.coordinates.lng) : '',
      });
    })();
  }, [id]);

  /** set đồng bộ: _lat/_lng + coordinates */
  const setCoordinates = useCallback((lat: number, lng: number) => {
    setStation(prev => (prev ? {
      ...prev,
      _lat: String(lat),
      _lng: String(lng),
      coordinates: { lat, lng },
    } : prev));
  }, []);

  // Auto geocode khi mapAddress thay đổi (và không phải dạng URL đã có lat,lng)
  const lastGeocoded = useRef<string | null>(null);
  useEffect(() => {
    if (!station?.mapAddress) return;
    const addr = station.mapAddress.trim();
    if (!addr || addr === lastGeocoded.current) return;

    // nếu là URL chứa lat,lng -> set ngay
    const fromUrl = extractLatLngFromGMapUrl(addr);
    if (fromUrl) {
      setCoordinates(fromUrl.lat, fromUrl.lng);
      lastGeocoded.current = addr;
      return;
    }

    const id = setTimeout(() => {
      geocodeRef.current(addr);
      lastGeocoded.current = addr;
    }, 300);

    return () => clearTimeout(id);
  }, [station?.mapAddress, setCoordinates]);

  // nhận kết quả geocode
  useEffect(() => {
    if (!coords) return;
    setCoordinates(coords.lat, coords.lng);
  }, [coords, setCoordinates]);

  /** Ô tọa độ duy nhất (nhập tay) */
  const handleCoordinateInput = (value: string) => {
    const pair = parseLatLngPair(value);
    if (pair) {
      setCoordinates(pair.lat, pair.lng);
    } else {
      setStation(prev => (prev ? { ...prev, _lat: '', _lng: '' } : prev));
    }
  };

  const handleChange = (field: keyof BatteryStation, value: any) => {
    setStation(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!station) return;
    setSaving(true);
    try {
      // chuẩn hoá: nếu _lat/_lng hợp lệ -> ghi vào coordinates
      const lat = parseFloat(station._lat || '');
      const lng = parseFloat(station._lng || '');
      const coordsToSave =
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat, lng }
          : (station.coordinates || undefined);

      await update(id, {
        name: station.name || '',
        displayAddress: station.displayAddress || '',
        mapAddress: station.mapAddress || '',
        coordinates: coordsToSave,
        vehicleType: (station.vehicleType as VehicleType) || 'motorbike',
        isActive: station.isActive ?? true,
        updatedAt: Timestamp.now(),
      });

      await reload();
      onClose();
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi khi cập nhật trạm pin.');
    } finally {
      setSaving(false);
    }
  };

  if (!station) return <p>Đang tải dữ liệu...</p>;

  const preview: LatLng | null = (() => {
    if (station._lat && station._lng && Number.isFinite(parseFloat(station._lat)) && Number.isFinite(parseFloat(station._lng))) {
      return { lat: parseFloat(station._lat), lng: parseFloat(station._lng) };
    }
    return station.coordinates ?? null;
  })();

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
        <Label htmlFor="mapAddress">Địa chỉ Google Maps (không bắt buộc)</Label>
        <Input
          id="mapAddress"
          value={station.mapAddress || ''}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      </div>

      {/* ✅ Chỉ 1 ô TỌA ĐỘ duy nhất */}
      <div>
        <Label htmlFor="coords">Tọa độ (vd: 16.07, 108.22 hoặc 16.07° N, 108.22° E)</Label>
        <Input
          id="coords"
          value={station._lat && station._lng ? `${station._lat}, ${station._lng}` : ''}
          onChange={(e) => handleCoordinateInput(e.target.value)}
        />
      </div>

      {preview && (
        <div className="h-48 rounded overflow-hidden border">
          <MapPreview coords={preview} />
        </div>
      )}

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
