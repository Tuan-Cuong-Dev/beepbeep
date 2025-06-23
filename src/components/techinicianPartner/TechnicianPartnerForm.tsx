'use client';

import { useState } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { WorkingHours } from '@/src/lib/technicianPartners/workingHoursTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';
import { Checkbox } from '@/src/components/ui/checkbox';

interface Props {
  initialData?: Partial<TechnicianPartner>;
  onSave: (data: Partial<TechnicianPartner>) => void;
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

export default function TechnicianPartnerForm({ initialData = {}, onSave }: Props) {
  const [formData, setFormData] = useState<Partial<TechnicianPartner>>({
    ...initialData,
    workingHours: initialData.workingHours || defaultWorkingHours,
    assignedRegions: initialData.assignedRegions || [],
    type: initialData.type || 'mobile',
  });

  const updateField = (field: keyof TechnicianPartner, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateWorkingHours = (index: number, field: keyof WorkingHours, value: any) => {
    const updated = [...(formData.workingHours || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('workingHours', updated);
  };

  const handleRegionInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const regions = event.target.value.split('\n').map((r) => r.trim()).filter(Boolean);
    updateField('assignedRegions', regions);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}
      className="space-y-4"
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
          placeholder="Email"
          value={formData.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium mb-1">Technician Type</label>
          <SimpleSelect
            placeholder="Select technician type"
            options={[
              { label: 'Shop-based Technician', value: 'shop' },
              { label: 'Mobile Technician', value: 'mobile' },
            ]}
            value={formData.type}
            onChange={(val) => updateField('type', val)}
          />
        </div>

        {formData.type === 'shop' && (
          <>
            <Input
              placeholder="Shop Name"
              value={formData.shopName || ''}
              onChange={(e) => updateField('shopName', e.target.value)}
            />
            <Input
              placeholder="Shop Address"
              value={formData.shopAddress || ''}
              onChange={(e) => updateField('shopAddress', e.target.value)}
            />
          </>
        )}
      </div>

      <div>
        <label className="font-medium">Assigned Regions (one per line)</label>
        <Textarea
          rows={4}
          placeholder="DaNang/ThanhKhe/ThanhKheTay\nDaNang/HaiChau/BinhHien"
          value={(formData.assignedRegions || []).join('\n')}
          onChange={handleRegionInput}
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
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={item.startTime}
                    onChange={(e) => updateWorkingHours(idx, 'startTime', e.target.value)}
                  />
                  <Input
                    type="time"
                    value={item.endTime}
                    onChange={(e) => updateWorkingHours(idx, 'endTime', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit">Save Technician Partner</Button>
    </form>
  );
}