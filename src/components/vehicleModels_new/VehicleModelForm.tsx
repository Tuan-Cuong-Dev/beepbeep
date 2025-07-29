'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Label } from '@/src/components/ui/label';
import { VehicleModel, VehicleType, FuelType } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { VEHICLE_SUB_TYPES } from '@/src/lib/vehicle-models/vehicleSubTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { SimpleSelect } from '@/src/components/ui/select';

interface Props {
  companyId: string;
  newModel: Partial<VehicleModel>;
  handleChange: <K extends keyof VehicleModel>(key: K, value: VehicleModel[K]) => void;
  handleSave: () => void;
  isUpdateModeModel: boolean;
  loading: boolean;
  onSaveComplete?: () => void;
}

const vehicleTypeOptions = [
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van / Limo' },
  { value: 'bus', label: 'Bus / Coach' },
  { value: 'other', label: 'Other' },
];

const fuelTypeOptions = [
  { value: 'electric', label: 'Electric' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function VehicleModelForm({
  companyId,
  newModel,
  handleChange,
  handleSave,
  isUpdateModeModel,
  loading,
}: Props) {
  const [priceInputs, setPriceInputs] = useState({ hour: '', day: '', week: '', month: '' });

  useEffect(() => {
    setPriceInputs({
      hour: newModel.pricePerHour ? formatCurrency(newModel.pricePerHour) : '',
      day: newModel.pricePerDay ? formatCurrency(newModel.pricePerDay) : '',
      week: newModel.pricePerWeek ? formatCurrency(newModel.pricePerWeek) : '',
      month: newModel.pricePerMonth ? formatCurrency(newModel.pricePerMonth) : '',
    });
  }, [newModel]);

  const renderCurrencyInput = (
    label: string,
    key: keyof typeof priceInputs,
    modelKey: keyof VehicleModel
  ) => (
    <div className="flex flex-col gap-1">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <Input
        type="text"
        placeholder={label}
        value={priceInputs[key]}
        onChange={(e) => {
          setPriceInputs((prev) => ({ ...prev, [key]: e.target.value }));
          handleChange(modelKey, parseCurrencyString(e.target.value));
        }}
        onFocus={(e) => {
          e.target.select();
          setPriceInputs((prev) => ({
            ...prev,
            [key]: (newModel[modelKey] || 0).toString(),
          }));
        }}
        onBlur={() => {
          setPriceInputs((prev) => ({
            ...prev,
            [key]: newModel[modelKey] ? formatCurrency(newModel[modelKey] as number) : '',
          }));
        }}
      />
    </div>
  );

  // 🔄 Lọc các sub type tương ứng với vehicleType
  const filteredSubTypeOptions = VEHICLE_SUB_TYPES
    .filter((s) => s.vehicleType === newModel.vehicleType)
    .map((s) => ({ label: s.label, value: s.value }));

  return (
    <div className="hidden md:block bg-white rounded-2xl shadow p-8 mt-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        {isUpdateModeModel ? 'Edit Vehicle Model' : 'Add New Vehicle Model'}
      </h2>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Input placeholder="Model Name" value={newModel.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
          <Textarea placeholder="Description" value={newModel.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
          <Input placeholder="Image URL" value={newModel.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SimpleSelect
            options={vehicleTypeOptions}
            placeholder="Select Vehicle Type"
            value={newModel.vehicleType}
            onChange={(val) => {
              handleChange('vehicleType', val as VehicleType);
              handleChange('vehicleSubType', ''); // Reset subtype khi đổi loại
            }}
          />

          <SimpleSelect
            options={filteredSubTypeOptions}
            placeholder="Select Sub Type"
            value={newModel.vehicleSubType}
            onChange={(val) => handleChange('vehicleSubType', val)}
            disabled={!newModel.vehicleType}
          />
          
          <Input placeholder="Brand (e.g. VinFast)" value={newModel.brand || ''} onChange={(e) => handleChange('brand', e.target.value)} />
          <Input placeholder="Model Code" value={newModel.modelCode || ''} onChange={(e) => handleChange('modelCode', e.target.value)} />
          <Input placeholder="Battery Capacity (e.g. 72V22Ah)" value={newModel.batteryCapacity || ''} onChange={(e) => handleChange('batteryCapacity', e.target.value)} />
          <Input type="number" placeholder="Motor Power (W)" value={newModel.motorPower ?? ''} onChange={(e) => handleChange('motorPower', e.target.valueAsNumber || 0)} />
          <SimpleSelect options={fuelTypeOptions} placeholder="Select Fuel Type" value={newModel.fuelType} onChange={(val) => handleChange('fuelType', val as FuelType)} />
          <Input type="number" placeholder="Top Speed (km/h)" value={newModel.topSpeed ?? ''} onChange={(e) => handleChange('topSpeed', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Range (km)" value={newModel.range ?? ''} onChange={(e) => handleChange('range', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Weight (kg)" value={newModel.weight ?? ''} onChange={(e) => handleChange('weight', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Max Load (kg)" value={newModel.maxLoad ?? ''} onChange={(e) => handleChange('maxLoad', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Capacity (seats)" value={newModel.capacity ?? ''} onChange={(e) => handleChange('capacity', e.target.valueAsNumber || 0)} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Rental Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {renderCurrencyInput('Price Per Hour (VND)', 'hour', 'pricePerHour')}
          {renderCurrencyInput('Price Per Day (VND)', 'day', 'pricePerDay')}
          {renderCurrencyInput('Price Per Week (VND)', 'week', 'pricePerWeek')}
          {renderCurrencyInput('Price Per Month (VND)', 'month', 'pricePerMonth')}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Availability</h3>
        <div className="flex items-center gap-2">
          <Checkbox checked={!!newModel.available} onCheckedChange={(checked) => handleChange('available', !!checked)} />
          <Label>Available for rent?</Label>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="mt-4 w-fit">
        {loading ? 'Saving...' : isUpdateModeModel ? 'Save Changes' : 'Add Model'}
      </Button>
    </div>
  );
}
