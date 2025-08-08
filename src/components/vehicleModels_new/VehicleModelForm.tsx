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
import { useTranslation } from 'react-i18next';

interface Props {
  companyId: string;
  newModel: Partial<VehicleModel>;
  handleChange: <K extends keyof VehicleModel>(key: K, value: VehicleModel[K]) => void;
  handleSave: () => void;
  isUpdateModeModel: boolean;
  loading: boolean;
  onSaveComplete?: () => void;
}

export default function VehicleModelForm({
  companyId,
  newModel,
  handleChange,
  handleSave,
  isUpdateModeModel,
  loading,
}: Props) {
  const { t } = useTranslation('common');

  const vehicleTypeOptions = [
    { value: 'bike', label: t('vehicle_model_form.vehicle_type.bike') },
    { value: 'motorbike', label: t('vehicle_model_form.vehicle_type.motorbike') },
    { value: 'car', label: t('vehicle_model_form.vehicle_type.car') },
    { value: 'van', label: t('vehicle_model_form.vehicle_type.van') },
    { value: 'bus', label: t('vehicle_model_form.vehicle_type.bus') },
    { value: 'other', label: t('vehicle_model_form.vehicle_type.other') },
  ];

  const fuelTypeOptions = [
    { value: 'electric', label: t('vehicle_model_form.fuel_type.electric') },
    { value: 'gasoline', label: t('vehicle_model_form.fuel_type.gasoline') },
    { value: 'hybrid', label: t('vehicle_model_form.fuel_type.hybrid') },
  ];

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

  const filteredSubTypeOptions = VEHICLE_SUB_TYPES
    .filter((s) => s.vehicleType === newModel.vehicleType)
    .map((s) => ({
      value: s.value,
      label: t(`vehicle_model_form.sub_type.${s.value}`, { defaultValue: s.label }),
    }));

  return (
    <div className="hidden md:block bg-white rounded-2xl shadow p-8 mt-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        {isUpdateModeModel
          ? t('vehicle_model_form.title_edit')
          : t('vehicle_model_form.title_add')}
      </h2>

      {/* Basic Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">
          {t('vehicle_model_form.section.basic')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Input
            placeholder={t('vehicle_model_form.name')}
            value={newModel.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <Textarea
            placeholder={t('vehicle_model_form.description')}
            value={newModel.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <Input
            placeholder={t('vehicle_model_form.image_url')}
            value={newModel.imageUrl || ''}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
          />
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">
          {t('vehicle_model_form.section.specs')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SimpleSelect
            options={vehicleTypeOptions}
            placeholder={t('vehicle_model_form.select_vehicle_type')}
            value={newModel.vehicleType}
            onChange={(val) => {
              handleChange('vehicleType', val as VehicleType);
              handleChange('vehicleSubType', '');
            }}
          />
          <SimpleSelect
            options={filteredSubTypeOptions}
            placeholder={t('vehicle_model_form.select_sub_type')}
            value={newModel.vehicleSubType}
            onChange={(val) => handleChange('vehicleSubType', val)}
            disabled={!newModel.vehicleType}
          />
          <Input
            placeholder={t('vehicle_model_form.brand')}
            value={newModel.brand || ''}
            onChange={(e) => handleChange('brand', e.target.value)}
          />
          <Input
            placeholder={t('vehicle_model_form.model_code')}
            value={newModel.modelCode || ''}
            onChange={(e) => handleChange('modelCode', e.target.value)}
          />
          <Input
            placeholder={t('vehicle_model_form.battery_capacity')}
            value={newModel.batteryCapacity || ''}
            onChange={(e) => handleChange('batteryCapacity', e.target.value)}
          />
          <Input
            type="number"
            placeholder={t('vehicle_model_form.motor_power')}
            value={newModel.motorPower ?? ''}
            onChange={(e) =>
              handleChange('motorPower', e.target.valueAsNumber || 0)
            }
          />
          <SimpleSelect
            options={fuelTypeOptions}
            placeholder={t('vehicle_model_form.select_fuel_type')}
            value={newModel.fuelType}
            onChange={(val) => handleChange('fuelType', val as FuelType)}
          />
          <Input
            type="number"
            placeholder={t('vehicle_model_form.top_speed')}
            value={newModel.topSpeed ?? ''}
            onChange={(e) => handleChange('topSpeed', e.target.valueAsNumber || 0)}
          />
          <Input
            type="number"
            placeholder={t('vehicle_model_form.range')}
            value={newModel.range ?? ''}
            onChange={(e) => handleChange('range', e.target.valueAsNumber || 0)}
          />
          <Input
            type="number"
            placeholder={t('vehicle_model_form.weight')}
            value={newModel.weight ?? ''}
            onChange={(e) => handleChange('weight', e.target.valueAsNumber || 0)}
          />
          <Input
            type="number"
            placeholder={t('vehicle_model_form.max_load')}
            value={newModel.maxLoad ?? ''}
            onChange={(e) => handleChange('maxLoad', e.target.valueAsNumber || 0)}
          />
          <Input
            type="number"
            placeholder={t('vehicle_model_form.capacity')}
            value={newModel.capacity ?? ''}
            onChange={(e) => handleChange('capacity', e.target.valueAsNumber || 0)}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">
          {t('vehicle_model_form.section.pricing')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {renderCurrencyInput(t('vehicle_model_form.price_per_hour'), 'hour', 'pricePerHour')}
          {renderCurrencyInput(t('vehicle_model_form.price_per_day'), 'day', 'pricePerDay')}
          {renderCurrencyInput(t('vehicle_model_form.price_per_week'), 'week', 'pricePerWeek')}
          {renderCurrencyInput(t('vehicle_model_form.price_per_month'), 'month', 'pricePerMonth')}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">
          {t('vehicle_model_form.section.availability')}
        </h3>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!newModel.available}
            onCheckedChange={(checked) => handleChange('available', !!checked)}
          />
          <Label>{t('vehicle_model_form.available')}</Label>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="mt-4 w-fit">
        {loading
          ? t('vehicle_model_form.saving')
          : isUpdateModeModel
          ? t('vehicle_model_form.save_changes')
          : t('vehicle_model_form.add_model')}
      </Button>
    </div>
  );
}
