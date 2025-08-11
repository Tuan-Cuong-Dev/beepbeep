'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import { VehicleStatus, Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { useUser } from '@/src/context/AuthContext';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { useTranslation } from 'react-i18next';

interface Props {
  companyId: string;
  newVehicle: Vehicle;
  setNewVehicle: (bike: Vehicle) => void;
  models: VehicleModel[];
  stations: RentalStation[];
  isUpdateMode: boolean;
  setIsUpdateMode: (v: boolean) => void;
  setVehicles: (list: Vehicle[]) => void;
  onSaveComplete?: () => void;
  showStationSelect: boolean;
}

const RAW_STATUS: VehicleStatus[] = [
  'Available',
  'In Use',
  'Reserved',
  'Under Maintenance',
  'Sold',
  'Broken',
];

export default function VehicleForm({
  companyId,
  newVehicle,
  setNewVehicle,
  models,
  stations,
  isUpdateMode,
  setIsUpdateMode,
  setVehicles,
  onSaveComplete,
  showStationSelect,
}: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const isAdmin = role === 'admin';

  const handleChange = <K extends keyof Vehicle>(key: K, value: Vehicle[K]) => {
    setNewVehicle({ ...newVehicle, [key]: value });
  };

  const [pricePerHourInput, setPricePerHourInput] = useState('');
  const [pricePerDayInput, setPricePerDayInput] = useState('');
  const [pricePerWeekInput, setPricePerWeekInput] = useState('');
  const [pricePerMonthInput, setPricePerMonthInput] = useState('');

  const handleModelChange = (modelId: string) => {
    const selectedModel = models.find((m) => m.id === modelId);
    if (!selectedModel) return;

    const updatedValues: Partial<Vehicle> = {
      modelId,
      pricePerDay: selectedModel.pricePerDay || 0,
      pricePerHour: selectedModel.pricePerHour,
      pricePerWeek: selectedModel.pricePerWeek,
      pricePerMonth: selectedModel.pricePerMonth,
      batteryCapacity: selectedModel.batteryCapacity,
      range: selectedModel.range || 0,
    };

    setNewVehicle({ ...newVehicle, ...updatedValues });

    setPricePerHourInput(selectedModel.pricePerHour ? formatCurrency(selectedModel.pricePerHour) : '');
    setPricePerDayInput(selectedModel.pricePerDay ? formatCurrency(selectedModel.pricePerDay) : '');
    setPricePerWeekInput(selectedModel.pricePerWeek ? formatCurrency(selectedModel.pricePerWeek) : '');
    setPricePerMonthInput(selectedModel.pricePerMonth ? formatCurrency(selectedModel.pricePerMonth) : '');
  };

  useEffect(() => {
    setPricePerHourInput(newVehicle.pricePerHour ? formatCurrency(newVehicle.pricePerHour) : '');
    setPricePerDayInput(newVehicle.pricePerDay ? formatCurrency(newVehicle.pricePerDay) : '');
    setPricePerWeekInput(newVehicle.pricePerWeek ? formatCurrency(newVehicle.pricePerWeek) : '');
    setPricePerMonthInput(newVehicle.pricePerMonth ? formatCurrency(newVehicle.pricePerMonth) : '');
  }, [
    newVehicle.pricePerHour,
    newVehicle.pricePerDay,
    newVehicle.pricePerWeek,
    newVehicle.pricePerMonth,
  ]);

  const handleSubmit = async () => {
    if (
      !newVehicle.modelId ||
      !newVehicle.serialNumber ||
      !newVehicle.vehicleID ||
      (showStationSelect && !newVehicle.stationId)
    ) {
      alert(t('vehicle_form.msg_fill_required'));
      return;
    }

    const payload: Vehicle = {
      ...newVehicle,
      companyId,
      batteryCapacity: newVehicle.batteryCapacity,
      range: Number(newVehicle.range),
      odo: Number(newVehicle.odo),
      ...(newVehicle.pricePerDay !== undefined
        ? { pricePerDay: parseCurrencyString(pricePerDayInput) }
        : {}),
      ...(newVehicle.pricePerHour !== undefined
        ? { pricePerHour: parseCurrencyString(pricePerHourInput) }
        : {}),
      ...(newVehicle.pricePerWeek !== undefined
        ? { pricePerWeek: parseCurrencyString(pricePerWeekInput) }
        : {}),
      ...(newVehicle.pricePerMonth !== undefined
        ? { pricePerMonth: parseCurrencyString(pricePerMonthInput) }
        : {}),
    };

    try {
      const { saveVehicle } = await import('@/src/lib/vehicles/vehicleService');
      const updatedList = await saveVehicle(payload, isUpdateMode);
      setVehicles(updatedList);
      setIsUpdateMode(false);
      onSaveComplete?.();
    } catch (err) {
      console.error('❌ Failed to save Vehicle:', err);
    }
  };

  // status options -> dùng key trong JSON: status_available, status_in_use, ...
  const statusOptions = RAW_STATUS.map((s) => ({
    value: s,
    label:
      s === 'Available' ? t('vehicle_form.status_available') :
      s === 'In Use' ? t('vehicle_form.status_in_use') :
      s === 'Reserved' ? t('vehicle_form.status_reserved') :
      s === 'Under Maintenance' ? t('vehicle_form.status_under_maintenance') :
      s === 'Sold' ? t('vehicle_form.status_sold') :
      t('vehicle_form.status_broken'),
  }));

  return (
    <div className="hidden md:block bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">
        {isUpdateMode ? t('vehicle_form.title_edit') : t('vehicle_form.title_add')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700">
          {t('vehicle_form.section_basic_info')}
        </h3>

        {isAdmin && (
          <Input
            placeholder={t('vehicle_form.company_id')}
            value={newVehicle.companyId}
            onChange={(e) => handleChange('companyId', e.target.value)}
            className="col-span-1"
          />
        )}

        <SimpleSelect
          options={models.map((m) => ({ label: m.name, value: m.id }))}
          placeholder={t('vehicle_form.select_model')}
          value={newVehicle.modelId || ''}
          onChange={handleModelChange}
          className="col-span-1"
        />

        {showStationSelect && (
          <SimpleSelect
            options={stations.map((s) => ({ label: s.name, value: s.id }))}
            placeholder={t('vehicle_form.select_station')}
            value={newVehicle.stationId || ''}
            onChange={(val) => handleChange('stationId', val)}
            className="col-span-1"
          />
        )}

        <Input
          placeholder={t('vehicle_form.serial_number')}
          value={newVehicle.serialNumber}
          onChange={(e) => handleChange('serialNumber', e.target.value)}
        />
        <Input
          placeholder={t('vehicle_form.vehicle_id')}
          value={newVehicle.vehicleID}
          onChange={(e) => handleChange('vehicleID', e.target.value)}
        />
        <Input
          placeholder={t('vehicle_form.plate_number')}
          value={newVehicle.plateNumber}
          onChange={(e) => handleChange('plateNumber', e.target.value)}
        />

        <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700 mt-6">
          {t('vehicle_form.section_specifications')}
        </h3>

        <Input
          type="number"
          placeholder={t('vehicle_form.odo')}
          value={newVehicle.odo || ''}
          onChange={(e) => handleChange('odo', e.target.valueAsNumber || 0)}
        />
        <Input
          placeholder={t('vehicle_form.color')}
          value={newVehicle.color}
          onChange={(e) => handleChange('color', e.target.value)}
        />
        <Input
          placeholder={t('vehicle_form.battery_capacity')}
          value={newVehicle.batteryCapacity || ''}
          onChange={(e) => handleChange('batteryCapacity', e.target.value)}
        />
        <Input
          type="number"
          placeholder={t('vehicle_form.range')}
          value={newVehicle.range || ''}
          onChange={(e) => handleChange('range', e.target.valueAsNumber || 0)}
        />
        <SimpleSelect
          options={statusOptions}
          placeholder={t('vehicle_form.select_status')}
          value={newVehicle.status}
          onChange={(val) => handleChange('status', val as VehicleStatus)}
        />
        <Textarea
          placeholder={t('vehicle_form.current_location')}
          value={newVehicle.currentLocation}
          onChange={(e) => handleChange('currentLocation', e.target.value)}
        />

        <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700 mt-6">
          {t('vehicle_form.section_pricing')}
        </h3>

        <Input
          type="text"
          placeholder={t('vehicle_form.price_hour')}
          value={pricePerHourInput}
          onChange={(e) => {
            setPricePerHourInput(e.target.value);
            handleChange('pricePerHour', parseCurrencyString(e.target.value));
          }}
          onFocus={(e) => {
            e.target.select();
            setPricePerHourInput((newVehicle.pricePerHour || 0).toString());
          }}
          onBlur={() => setPricePerHourInput(formatCurrency(newVehicle.pricePerHour || 0))}
        />

        <Input
          type="text"
          placeholder={t('vehicle_form.price_day')}
          value={pricePerDayInput}
          onChange={(e) => {
            setPricePerDayInput(e.target.value);
            handleChange('pricePerDay', parseCurrencyString(e.target.value));
          }}
          onFocus={(e) => {
            e.target.select();
            setPricePerDayInput((newVehicle.pricePerDay || 0).toString());
          }}
          onBlur={() => setPricePerDayInput(formatCurrency(newVehicle.pricePerDay || 0))}
        />

        <Input
          type="text"
          placeholder={t('vehicle_form.price_week')}
          value={pricePerWeekInput}
          onChange={(e) => {
            setPricePerWeekInput(e.target.value);
            handleChange('pricePerWeek', parseCurrencyString(e.target.value));
          }}
          onFocus={(e) => {
            e.target.select();
            setPricePerWeekInput((newVehicle.pricePerWeek || 0).toString());
          }}
          onBlur={() => setPricePerWeekInput(formatCurrency(newVehicle.pricePerWeek || 0))}
        />

        <Input
          type="text"
          placeholder={t('vehicle_form.price_month')}
          value={pricePerMonthInput}
          onChange={(e) => {
            setPricePerMonthInput(e.target.value);
            handleChange('pricePerMonth', parseCurrencyString(e.target.value));
          }}
          onFocus={(e) => {
            e.target.select();
            setPricePerMonthInput((newVehicle.pricePerMonth || 0).toString());
          }}
          onBlur={() => setPricePerMonthInput(formatCurrency(newVehicle.pricePerMonth || 0))}
        />

        <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700 mt-6">
          {t('vehicle_form.section_note')}
        </h3>
        <Textarea
          placeholder={t('vehicle_form.note_placeholder')}
          value={newVehicle.note || ''}
          onChange={(e) => handleChange('note', e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} className="mt-6">
        {isUpdateMode ? t('vehicle_form.btn_save') : t('vehicle_form.btn_add')}
      </Button>
    </div>
  );
}
