'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Station, StationFormValues } from '@/src/lib/stations/stationTypes';

interface Props {
  companyId: string;
  editingStation: Station;
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditStationForm({
  companyId,
  editingStation,
  onCancel,
  onSaved,
}: Props) {
  const [form, setForm] = useState<StationFormValues>({
    name: editingStation.name,
    displayAddress: editingStation.displayAddress,
    mapAddress: editingStation.mapAddress,
    location: editingStation.location,
  });

  const [status, setStatus] = useState<'active' | 'inactive'>(
    editingStation.status ?? 'active'
  );

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        location: `${coords.lat}° N, ${coords.lng}° E`,
      }));
    }
  }, [coords]);

  const handleChange = (key: keyof StationFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) geocode(form.mapAddress);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'rentalStations', editingStation.id), {
        ...form,
        companyId,
        status,
        updatedAt: serverTimestamp(),
      });
      onSaved();
    } catch (err) {
      console.error('❌ Error updating station:', err);
    }
  };

  // ✅ Trích xuất lat/lng từ location nếu hợp lệ
  const getMapCoords = (): { lat: string; lng: string } | null => {
    const match = form.location.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
    if (!match) return null;
    return { lat: match[1], lng: match[3] };
  };

  const coordsForMap = getMapCoords();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">✏️ Edit Station</h2>

      <Input
        placeholder="Station Name"
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Input
        placeholder="Display Address"
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Input
        placeholder="Map Address (Google link or full address)"
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
        onBlur={handleMapAddressBlur}
      />
      <Input
        placeholder="Location (auto-filled)"
        value={form.location}
        readOnly
      />

      {/* ✅ Toggle trạng thái */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          <option value="active">✅ Active</option>
          <option value="inactive">🚫 Inactive</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">📍 Detecting location...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {coordsForMap && (
        <iframe
          title="Map Preview"
          width="100%"
          height="200"
          className="rounded-xl"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps?q=${coordsForMap.lat},${coordsForMap.lng}&hl=vi&z=16&output=embed`}
        ></iframe>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          className="bg-[#00d289] text-white hover:bg-[#00b67a]"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
