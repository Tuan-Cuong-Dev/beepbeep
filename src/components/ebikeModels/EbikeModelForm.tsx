'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Label } from '@/src/components/ui/label';
import { EbikeModel } from '@/src/lib/ebikemodels/ebikeModelTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';

interface Props {
  companyId: string;
  newEbikeModel: EbikeModel;
  handleChange: <K extends keyof EbikeModel>(key: K, value: EbikeModel[K]) => void;
  handleSave: () => void;
  isUpdateModeModel: boolean;
  loading: boolean;
  onSaveComplete?: () => void;
}

export default function EbikeModelForm({
  companyId,
  newEbikeModel,
  handleChange,
  handleSave,
  isUpdateModeModel,
  loading,
}: Props) {
  const [priceInputs, setPriceInputs] = useState({
    hour: '',
    day: '',
    week: '',
    month: '',
  });

  useEffect(() => {
    setPriceInputs({
      hour: newEbikeModel.pricePerHour ? formatCurrency(newEbikeModel.pricePerHour) : '',
      day: newEbikeModel.pricePerDay ? formatCurrency(newEbikeModel.pricePerDay) : '',
      week: newEbikeModel.pricePerWeek ? formatCurrency(newEbikeModel.pricePerWeek) : '',
      month: newEbikeModel.pricePerMonth ? formatCurrency(newEbikeModel.pricePerMonth) : '',
    });
  }, [newEbikeModel]);

  const renderCurrencyInput = (
    label: string,
    key: keyof typeof priceInputs,
    modelKey: keyof EbikeModel
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
            [key]: (newEbikeModel[modelKey] || 0).toString(),
          }));
        }}
        onBlur={() => {
          setPriceInputs((prev) => ({
            ...prev,
            [key]: newEbikeModel[modelKey]
              ? formatCurrency(newEbikeModel[modelKey] as number)
              : '',
          }));
        }}
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow p-8 mt-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        {isUpdateModeModel ? 'Edit Vehicle Model' : 'Add New Vehicle Model'}
      </h2>

      {/* Basic Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Input placeholder="Model Name" value={newEbikeModel.name} onChange={(e) => handleChange('name', e.target.value)} />
          <Textarea placeholder="Description" value={newEbikeModel.description} onChange={(e) => handleChange('description', e.target.value)} />
          <Input placeholder="Image URL" value={newEbikeModel.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} />
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Input
            type="text"
            placeholder="Battery Capacity (e.g. 72V22Ah)"
            value={newEbikeModel.batteryCapacity || ''}
            onChange={(e) => handleChange('batteryCapacity', e.target.value)}
          />
          <Input type="number" placeholder="Motor Power (W)" value={newEbikeModel.motorPower || ''} onChange={(e) => handleChange('motorPower', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Top Speed (km/h)" value={newEbikeModel.topSpeed || ''} onChange={(e) => handleChange('topSpeed', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Range (km)" value={newEbikeModel.range || ''} onChange={(e) => handleChange('range', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Weight (kg)" value={newEbikeModel.weight || ''} onChange={(e) => handleChange('weight', e.target.valueAsNumber || 0)} />
          <Input type="number" placeholder="Max Load (kg)" value={newEbikeModel.maxLoad || ''} onChange={(e) => handleChange('maxLoad', e.target.valueAsNumber || undefined)} />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Rental Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {renderCurrencyInput('Price Per Hour (VND)', 'hour', 'pricePerHour')}
          {renderCurrencyInput('Price Per Day (VND)', 'day', 'pricePerDay')}
          {renderCurrencyInput('Price Per Week (VND)', 'week', 'pricePerWeek')}
          {renderCurrencyInput('Price Per Month (VND)', 'month', 'pricePerMonth')}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Availability</h3>
        <div className="flex items-center gap-2">
          <Checkbox checked={newEbikeModel.available} onCheckedChange={(checked) => handleChange('available', !!checked)} />
          <Label>Available for rent?</Label>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="mt-4 w-fit">
        {loading ? 'Saving...' : isUpdateModeModel ? 'Save Changes' : 'Add Model'}
      </Button>
    </div>
  );
}
