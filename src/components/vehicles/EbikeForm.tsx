'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import { EbikeStatus, Ebike } from '@/src/lib/vehicles/vehicleTypes';
import { EbikeModel } from '@/src/lib/vehicleModels/vehicleModelTypes';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { useUser } from '@/src/context/AuthContext';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';

interface Props {
  companyId: string;
  newEbike: Ebike;
  setNewEbike: (bike: Ebike) => void;
  models: EbikeModel[];
  stations: RentalStation[];
  isUpdateMode: boolean;
  setIsUpdateMode: (v: boolean) => void;
  setEbikes: (list: Ebike[]) => void;
  onSaveComplete?: () => void;
  showStationSelect: boolean;
}

const statusOptions: EbikeStatus[] = [
  'Available',
  'In Use',
  'Reserved',
  'Under Maintenance',
  'Sold',
  'Broken',
];

export default function EbikeForm({
  companyId,
  newEbike,
  setNewEbike,
  models,
  stations,
  isUpdateMode,
  setIsUpdateMode,
  setEbikes,
  onSaveComplete,
  showStationSelect,
}: Props) {
  const { role } = useUser();
  const isAdmin = role === 'admin';

  const handleChange = <K extends keyof Ebike>(key: K, value: Ebike[K]) => {
    setNewEbike({ ...newEbike, [key]: value });
  };

  const handleModelChange = (modelId: string) => {
    const selectedModel = models.find((m) => m.id === modelId);
    if (!selectedModel) return;

    const updatedValues: Partial<Ebike> = {
      modelId: modelId,
      pricePerDay: selectedModel.pricePerDay || 0,
      pricePerHour: selectedModel.pricePerHour,
      pricePerWeek: selectedModel.pricePerWeek,
      pricePerMonth: selectedModel.pricePerMonth,
      batteryCapacity: selectedModel.batteryCapacity,
      range: selectedModel.range || 0,
    };

    setNewEbike({
      ...newEbike,
      ...updatedValues,
    });

    setPricePerHourInput(selectedModel.pricePerHour ? formatCurrency(selectedModel.pricePerHour) : '');
    setPricePerDayInput(selectedModel.pricePerDay ? formatCurrency(selectedModel.pricePerDay) : '');
    setPricePerWeekInput(selectedModel.pricePerWeek ? formatCurrency(selectedModel.pricePerWeek) : '');
    setPricePerMonthInput(selectedModel.pricePerMonth ? formatCurrency(selectedModel.pricePerMonth) : '');
  };

  const [pricePerHourInput, setPricePerHourInput] = useState('');
  const [pricePerDayInput, setPricePerDayInput] = useState('');
  const [pricePerWeekInput, setPricePerWeekInput] = useState('');
  const [pricePerMonthInput, setPricePerMonthInput] = useState('');

  useEffect(() => {
    setPricePerHourInput(newEbike.pricePerHour ? formatCurrency(newEbike.pricePerHour) : '');
    setPricePerDayInput(newEbike.pricePerDay ? formatCurrency(newEbike.pricePerDay) : '');
    setPricePerWeekInput(newEbike.pricePerWeek ? formatCurrency(newEbike.pricePerWeek) : '');
    setPricePerMonthInput(newEbike.pricePerMonth ? formatCurrency(newEbike.pricePerMonth) : '');
  }, [
    newEbike.pricePerHour,
    newEbike.pricePerDay,
    newEbike.pricePerWeek,
    newEbike.pricePerMonth,
  ]);

  const handleSubmit = async () => {
    if (!newEbike.modelId || !newEbike.serialNumber || !newEbike.vehicleID || (showStationSelect && !newEbike.stationId)) {
      alert('Please fill all required fields');
      return;
    }

    const payload = {
      ...newEbike,
      batteryCapacity: newEbike.batteryCapacity,
      range: Number(newEbike.range),
      odo: Number(newEbike.odo),
      ...(newEbike.pricePerDay !== undefined ? { pricePerDay: parseCurrencyString(pricePerDayInput) } : {}),
      ...(newEbike.pricePerHour !== undefined ? { pricePerHour: parseCurrencyString(pricePerHourInput) } : {}),
      ...(newEbike.pricePerWeek !== undefined ? { pricePerWeek: parseCurrencyString(pricePerWeekInput) } : {}),
      ...(newEbike.pricePerMonth !== undefined ? { pricePerMonth: parseCurrencyString(pricePerMonthInput) } : {}),
    };

    try {
      const { saveEbike } = await import('@/src/lib/vehicles/vehicleService');
      const updatedList = await saveEbike(payload, isUpdateMode);
      setEbikes(updatedList);
      setIsUpdateMode(false);
      onSaveComplete?.();
    } catch (err) {
      console.error('❌ Failed to save ebike:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">
        {isUpdateMode ? 'Edit Vehicle' : 'Add New Vehicle'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Basic Info Header */}
      <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700">Basic Information</h3>

      {isAdmin && (
        <Input
          placeholder="Company ID"
          value={newEbike.companyId}
          onChange={(e) => handleChange('companyId', e.target.value)}
          className="col-span-1"
        />
      )}

      <SimpleSelect
        options={models.map((m) => ({ label: m.name, value: m.id }))}
        placeholder="Select Model"
        value={newEbike.modelId || ''}
        onChange={handleModelChange}
        className="col-span-1"
      />

      {showStationSelect && (
        <SimpleSelect
          options={stations.map((s) => ({ label: s.name, value: s.id }))}
          placeholder="Select Station"
          value={newEbike.stationId || ''}
          onChange={(val) => handleChange('stationId', val)}
          className="col-span-1"
        />
      )}

      <Input placeholder="Serial Number" value={newEbike.serialNumber} onChange={(e) => handleChange('serialNumber', e.target.value)} />
      <Input placeholder="Vehicle ID (VIN)" value={newEbike.vehicleID} onChange={(e) => handleChange('vehicleID', e.target.value)} />
      <Input placeholder="Plate Number" value={newEbike.plateNumber} onChange={(e) => handleChange('plateNumber', e.target.value)} />

      {/* Specifications */}
      <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700 mt-6">Specifications</h3>

      <Input type="number" placeholder="ODO (km)" value={newEbike.odo || ''} onChange={(e) => handleChange('odo', e.target.valueAsNumber || 0)} />
      <Input placeholder="Color" value={newEbike.color} onChange={(e) => handleChange('color', e.target.value)} />
      <Input placeholder="Battery Capacity (e.g. 72V22Ah)" value={newEbike.batteryCapacity || ''} onChange={(e) => handleChange('batteryCapacity', e.target.value)} />
      <Input type="number" placeholder="Range (km)" value={newEbike.range || ''} onChange={(e) => handleChange('range', e.target.valueAsNumber || 0)} />
      <SimpleSelect options={statusOptions.map((s) => ({ label: s, value: s }))} placeholder="Select Status" value={newEbike.status} onChange={(val) => handleChange('status', val as EbikeStatus)} />
      <Textarea placeholder="Current Location" value={newEbike.currentLocation} onChange={(e) => handleChange('currentLocation', e.target.value)} />

      {/* Pricing */}
      <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700 mt-6">Pricing</h3>

      <Input type="text" placeholder="Price/Hour (VNĐ)" value={pricePerHourInput} onChange={(e) => { setPricePerHourInput(e.target.value); handleChange('pricePerHour', parseCurrencyString(e.target.value)); }} onFocus={(e) => { e.target.select(); setPricePerHourInput((newEbike.pricePerHour || 0).toString()); }} onBlur={() => setPricePerHourInput(formatCurrency(newEbike.pricePerHour || 0))} />

      <Input type="text" placeholder="Price/Day (VNĐ)" value={pricePerDayInput} onChange={(e) => { setPricePerDayInput(e.target.value); handleChange('pricePerDay', parseCurrencyString(e.target.value)); }} onFocus={(e) => { e.target.select(); setPricePerDayInput((newEbike.pricePerDay || 0).toString()); }} onBlur={() => setPricePerDayInput(formatCurrency(newEbike.pricePerDay || 0))} />

      <Input type="text" placeholder="Price/Week (VNĐ)" value={pricePerWeekInput} onChange={(e) => { setPricePerWeekInput(e.target.value); handleChange('pricePerWeek', parseCurrencyString(e.target.value)); }} onFocus={(e) => { e.target.select(); setPricePerWeekInput((newEbike.pricePerWeek || 0).toString()); }} onBlur={() => setPricePerWeekInput(formatCurrency(newEbike.pricePerWeek || 0))} />

      <Input type="text" placeholder="Price/Month (VNĐ)" value={pricePerMonthInput} onChange={(e) => { setPricePerMonthInput(e.target.value); handleChange('pricePerMonth', parseCurrencyString(e.target.value)); }} onFocus={(e) => { e.target.select(); setPricePerMonthInput((newEbike.pricePerMonth || 0).toString()); }} onBlur={() => setPricePerMonthInput(formatCurrency(newEbike.pricePerMonth || 0))} />

      {/* Note */}
      <h3 className="col-span-1 md:col-span-3 font-semibold text-gray-700 mt-6">Additional Note</h3>
      <Textarea placeholder="Note (optional)" value={newEbike.note || ''} onChange={(e) => handleChange('note', e.target.value)} />
    </div>


      <Button onClick={handleSubmit} className="mt-6">
        {isUpdateMode ? 'Save Changes' : 'Add Vehicle'}
      </Button>
    </div>
  );
}
