'use client';

import { useState } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { WorkingHours } from '@/src/lib/technicianPartners/workingHoursTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';
import { Checkbox } from '@/src/components/ui/checkbox';
import { defaultWorkingHours } from '@/src/utils/defaultWorkingHours';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';

interface Props {
  onCreated?: () => void;
}

export default function AddTechnicianPartnerForm({ onCreated }: Props)  {
  const { addPartner } = useTechnicianPartners();

  const [formData, setFormData] = useState<Partial<TechnicianPartner>>({
    type: 'mobile',
    assignedRegions: [],
    workingHours: defaultWorkingHours,
    serviceCategories: [],
    isActive: true,
  });

  const updateField = (field: keyof TechnicianPartner, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const regions = e.target.value.split('\n').map((r) => r.trim()).filter(Boolean);
    updateField('assignedRegions', regions);
  };

  const handleWorkingHoursChange = (index: number, field: keyof WorkingHours, value: any) => {
    const updated = [...(formData.workingHours || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('workingHours', updated);
  };

  const toggleService = (service: string) => {
    const current = formData.serviceCategories || [];
    if (current.includes(service)) {
      updateField('serviceCategories', current.filter((s) => s !== service));
    } else {
      updateField('serviceCategories', [...current, service]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPartner(formData as TechnicianPartner);
    if (onCreated) onCreated(); // 👈 Gọi callback
    setFormData({
      type: 'mobile',
      assignedRegions: [],
      workingHours: defaultWorkingHours,
      serviceCategories: [],
      isActive: true,
    });
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold">Add Technician Partner</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Full name"
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

        <SimpleSelect
          placeholder="Select technician type"
          options={[
            { label: 'Shop-based Technician', value: 'shop' },
            { label: 'Mobile Technician', value: 'mobile' },
          ]}
          value={formData.type}
          onChange={(val) => updateField('type', val)}
        />

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
        <label className="block font-medium mb-1">Assigned Regions (one per line)</label>
        <Textarea
          rows={4}
          placeholder="DaNang/ThanhKhe/ThanhKheTay\nDaNang/HaiChau/BinhHien"
          value={(formData.assignedRegions || []).join('\n')}
          onChange={handleRegionInput}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Working Hours</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(formData.workingHours || []).map((day, idx) => (
            <div key={day.day} className="border p-2 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="capitalize font-semibold">{day.day}</span>
                <Checkbox
                  checked={day.isWorking}
                  onCheckedChange={(val) => handleWorkingHoursChange(idx, 'isWorking', !!val)}
                />
              </div>
              {day.isWorking && (
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleWorkingHoursChange(idx, 'startTime', e.target.value)}
                  />
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleWorkingHoursChange(idx, 'endTime', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">Service Categories</label>
        <div className="flex flex-wrap gap-3">
          {['battery', 'brake', 'flat_tire', 'engine', 'electrical'].map((service) => (
            <label key={service} className="flex items-center gap-2">
              <Checkbox
                checked={(formData.serviceCategories || []).includes(service)}
                onCheckedChange={() => toggleService(service)}
              />
              <span className="capitalize">{service.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setFormData({})}>
          Cancel
        </Button>
        <Button type="submit">Add Partner</Button>
      </div>
    </form>
  );
}
