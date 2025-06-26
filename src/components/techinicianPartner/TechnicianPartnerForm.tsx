'use client';

import { useEffect, useState } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { WorkingHours } from '@/src/lib/technicianPartners/workingHoursTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';
import { Checkbox } from '@/src/components/ui/checkbox';
import dynamic from 'next/dynamic';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

const MapPicker = dynamic(() => import('@/src/components/map/MapPicker'), { ssr: false });
const Select = dynamic(() => import('react-select'), { ssr: false });

interface Props {
  initialData?: Partial<TechnicianPartner>;
  onSave: (
    data: Partial<TechnicianPartner & { email: string; password: string; role: 'technician_partner' }>
  ) => Promise<void>;
}

const daysOfWeek: WorkingHours['day'][] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const defaultWorkingHours: WorkingHours[] = daysOfWeek.map((day) => ({
  day,
  isWorking: false,
  startTime: '',
  endTime: '',
}));

const serviceOptions = [
  { label: 'Battery', value: 'battery' },
  { label: 'Brake', value: 'brake' },
  { label: 'Flat Tire', value: 'flat_tire' },
  { label: 'Motor', value: 'motor' },
  { label: 'Electrical', value: 'electrical' },
];

export default function TechnicianPartnerForm({ initialData, onSave }: Props) {
  const isEditMode = !!initialData?.id;
  const [formData, setFormData] = useState<
    Partial<TechnicianPartner & { email: string; password: string; role: 'technician_partner' }>
  >({});

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  useEffect(() => {
    setFormData({
      ...initialData,
      workingHours: initialData?.workingHours ?? defaultWorkingHours,
      assignedRegions: initialData?.assignedRegions ?? [],
      type: initialData?.type ?? 'mobile',
      mapAddress: initialData?.mapAddress ?? '',
      coordinates: initialData?.coordinates ?? undefined,
    });
  }, [initialData]);

  useEffect(() => {
    if (coords) {
      setFormData((prev) => ({ ...prev, coordinates: coords }));
    }
  }, [coords]);

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateWorkingHours = (index: number, field: keyof WorkingHours, value: any) => {
    const updated = [...(formData.workingHours || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('workingHours', updated);
  };

  const handleRegionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const regions = e.target.value.split('\n').map((r) => r.trim()).filter(Boolean);
    updateField('assignedRegions', regions);
  };

  const handleGeocode = () => {
    if (formData.mapAddress?.trim()) geocode(formData.mapAddress);
  };

  const resetForm = () => {
    setFormData({
      workingHours: defaultWorkingHours,
      assignedRegions: [],
      type: 'mobile',
      mapAddress: '',
      coordinates: undefined,
      name: '',
      phone: '',
      email: '',
      password: '',
      serviceCategories: [],
      shopName: '',
      shopAddress: '',
    });
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({ ...formData, role: 'technician_partner' });
        if (!isEditMode) resetForm();
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Name"
          value={formData.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
        />
        <Input
          placeholder="Phone"
          value={formData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
        />
        <Input
          placeholder="Email (for login)"
          value={formData.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
        />
        <Input
          placeholder="Password (for login) "
          type="password"
          value={formData.password || ''}
          onChange={(e) => updateField('password', e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium mb-1">Technician Type</label>
          <SimpleSelect
            placeholder="Select technician type"
            options={[
              { label: 'Shop-based Technician', value: 'shop' },
              { label: 'Mobile Technician', value: 'mobile' },
            ]}
            value={formData.type || ''}
            onChange={(val: string) => updateField('type', val)}
          />
        </div>

        {formData.type === 'shop' && (
          <>
            <Input
              placeholder="Shop Name"
              value={formData.shopName || ''}
              onChange={(e) => updateField('shopName', e.target.value)}
            />
            <Textarea
              placeholder="Map Address (Google Maps link with coordinates)"
              value={formData.mapAddress || ''}
              onChange={(e) => updateField('mapAddress', e.target.value)}
              onBlur={handleGeocode}
            />
            <Input
              placeholder="Coordinates (lat,lng)"
              value={formData.coordinates ? `${formData.coordinates.lat}, ${formData.coordinates.lng}` : ''}
              readOnly={!!coords}
              onChange={(e) => {
                const parts = e.target.value.split(',');
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                  updateField('coordinates', { lat, lng });
                }
              }}
            />
            <Input
              placeholder="Shop Address"
              value={formData.shopAddress || ''}
              onChange={(e) => updateField('shopAddress', e.target.value)}
            />
          </>
        )}
      </div>

      {formData.type === 'shop' && coords && (
        <>
          <p className="text-sm text-gray-600">
            📌 Detected: {coords.lat}° N, {coords.lng}° E
          </p>
          <iframe
            title="Map Preview"
            width="100%"
            height="200"
            className="rounded-xl"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
          ></iframe>
        </>
      )}

      <div>
        <label className="font-medium">Assigned Regions (one per line)</label>
        <Textarea
          rows={4}
          placeholder="DaNang/ThanhKhe/ThanhKheTay \nDaNang/HaiChau/BinhHien"
          value={(formData.assignedRegions || []).join('\n')}
          onChange={handleRegionInput}
        />
      </div>

      <div>
        <label className="font-medium block mb-1">Service Categories</label>
        <Select
          isMulti
          options={serviceOptions}
          value={serviceOptions.filter((opt) =>
            (formData.serviceCategories || []).includes(opt.value)
          )}
          onChange={(selected) => {
            const selectedOptions = selected as { label: string; value: string }[];
            updateField(
              'serviceCategories',
              selectedOptions.map((s) => s.value)
            );
          }}
        />
      </div>

      <div>
        <label className="font-medium block mb-2">Working Hours</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(formData.workingHours || []).map((item, idx) => (
            <div key={item.day} className="border p-2 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="capitalize font-semibold">{item.day}</span>
                <Checkbox
                  checked={item.isWorking}
                  onCheckedChange={(val) => updateWorkingHours(idx, 'isWorking', !!val)}
                />
              </div>
              {item.isWorking && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium">Start</label>
                    <input
                      type="time"
                      step="60"
                      value={item.startTime}
                      className="w-full border rounded px-2 py-1"
                      onChange={(e) =>
                        updateWorkingHours(idx, 'startTime', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium">End</label>
                    <input
                      type="time"
                      step="60"
                      value={item.endTime}
                      className="w-full border rounded px-2 py-1"
                      onChange={(e) =>
                        updateWorkingHours(idx, 'endTime', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit">
        {isEditMode ? 'Update Technician Partner' : 'Create Technician Partner Account'}
      </Button>
    </form>
  );
}
