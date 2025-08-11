'use client';

import { useEffect, useMemo, useState } from 'react';
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

  // ====== Search state + debounce ======
  const [modelSearch, setModelSearch] = useState('');
  const [stationSearch, setStationSearch] = useState('');
  const [debModel, setDebModel] = useState('');
  const [debStation, setDebStation] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebModel(modelSearch.trim().toLowerCase()), 150);
    return () => clearTimeout(id);
  }, [modelSearch]);

  useEffect(() => {
    const id = setTimeout(() => setDebStation(stationSearch.trim().toLowerCase()), 150);
    return () => clearTimeout(id);
  }, [stationSearch]);

  const filteredModels = useMemo(() => {
    if (!debModel) return models;
    return models.filter((m) => {
      const hay = [
        m.name,
        (m as any).brand,
        (m as any).type,
        (m as any).subType,
        m.batteryCapacity?.toString(),
        m.motorPower?.toString(),
        m.topSpeed?.toString(),
        m.range?.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(debModel);
    });
  }, [models, debModel]);

  const filteredStations = useMemo(() => {
    if (!debStation) return stations;
    return stations.filter((s) => {
      const hay = [s.name, s.displayAddress, s.mapAddress]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(debStation);
    });
  }, [stations, debStation]);

  // ====== Pricing inputs (formatted text fields) ======
  const [pricePerHourInput, setPricePerHourInput] = useState('');
  const [pricePerDayInput, setPricePerDayInput] = useState('');
  const [pricePerWeekInput, setPricePerWeekInput] = useState('');
  const [pricePerMonthInput, setPricePerMonthInput] = useState('');

  const selectedModel = useMemo(
    () => models.find((m) => m.id === newVehicle.modelId),
    [models, newVehicle.modelId]
  );

  const handleModelChange = (modelId: string) => {
    const sel = models.find((m) => m.id === modelId);
    if (!sel) return;

    const updatedValues: Partial<Vehicle> = {
      modelId,
      pricePerDay: sel.pricePerDay || 0,
      pricePerHour: sel.pricePerHour,
      pricePerWeek: sel.pricePerWeek,
      pricePerMonth: sel.pricePerMonth,
      batteryCapacity: sel.batteryCapacity,
      range: sel.range || 0,
    };

    setNewVehicle({ ...newVehicle, ...updatedValues });

    setPricePerHourInput(sel.pricePerHour ? formatCurrency(sel.pricePerHour) : '');
    setPricePerDayInput(sel.pricePerDay ? formatCurrency(sel.pricePerDay) : '');
    setPricePerWeekInput(sel.pricePerWeek ? formatCurrency(sel.pricePerWeek) : '');
    setPricePerMonthInput(sel.pricePerMonth ? formatCurrency(sel.pricePerMonth) : '');
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

    // helper: loại bỏ các field undefined để tránh lỗi updateDoc
    const omitUndefined = <T extends Record<string, any>>(obj: T): T =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

    // Chuẩn hóa giá từ input: rỗng => undefined, có giá trị => number
    const pricePerHour  = pricePerHourInput.trim()  === '' ? undefined : parseCurrencyString(pricePerHourInput);
    const pricePerDay   = pricePerDayInput.trim()   === '' ? undefined : parseCurrencyString(pricePerDayInput);
    const pricePerWeek  = pricePerWeekInput.trim()  === '' ? undefined : parseCurrencyString(pricePerWeekInput);
    const pricePerMonth = pricePerMonthInput.trim() === '' ? undefined : parseCurrencyString(pricePerMonthInput);

    const payloadRaw: Partial<Vehicle> = {
      ...newVehicle,
      companyId,
      // số liệu dạng number: fallback về 0 nếu nullish
      range: Number(newVehicle.range ?? 0),
      odo: Number(newVehicle.odo ?? 0),
      // override giá bằng giá trị đã chuẩn hóa từ input
      pricePerHour,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
    };

    // Loại bỏ mọi field undefined để không ném lỗi Firestore
    const payload = omitUndefined(payloadRaw) as Vehicle;

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


  // status options -> dùng key trong JSON
  const statusOptions = RAW_STATUS.map((s) => ({
    value: s,
    label:
      s === 'Available'
        ? t('vehicle_form.status_available')
        : s === 'In Use'
        ? t('vehicle_form.status_in_use')
        : s === 'Reserved'
        ? t('vehicle_form.status_reserved')
        : s === 'Under Maintenance'
        ? t('vehicle_form.status_under_maintenance')
        : s === 'Sold'
        ? t('vehicle_form.status_sold')
        : t('vehicle_form.status_broken'),
  }));

  return (
    <div className="hidden md:block bg-transparent mt-6">
      <h2 className="text-xl font-semibold mb-4">
        {isUpdateMode ? t('vehicle_form.title_edit') : t('vehicle_form.title_add')}
      </h2>

      <div className="grid grid-cols-1 gap-6">
        {/* ===== Basic Info Card ===== */}
        <section className="bg-white rounded-2xl shadow border">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              {t('vehicle_form.section_basic_info')}
            </h3>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('vehicle_form.company_id')}</span>
                <Input
                  value={newVehicle.companyId}
                  onChange={(e) => handleChange('companyId', e.target.value)}
                  className="h-8 w-44"
                  placeholder={t('vehicle_form.company_id')}
                />
              </div>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Model & Station Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Model block */}
              <div className="rounded-xl border">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <span className="font-medium">{t('vehicle_form.select_model')}</span>
                  <span className="text-xs text-gray-500">
                    {filteredModels.length} {t('vehicle_form.items') ?? 'items'}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <Input
                    placeholder={t('vehicle_form.search_model_placeholder')}
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                  />
                  <SimpleSelect
                    options={filteredModels.map((m) => ({ label: m.name, value: m.id }))}
                    placeholder={t('vehicle_form.select_model')}
                    value={newVehicle.modelId || ''}
                    onChange={handleModelChange}
                    disabled={filteredModels.length === 0}
                  />
                  {filteredModels.length === 0 && (
                    <div className="text-xs text-amber-600">
                      {t('vehicle_form.no_models_hint')}
                    </div>
                  )}

                  {/* Quick spec chips */}
                  {selectedModel && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      {selectedModel.brand && (
                        <div className="rounded-full border px-3 py-1 bg-gray-50">{selectedModel.brand}</div>
                      )}
                      {selectedModel.motorPower && (
                        <div className="rounded-full border px-3 py-1 bg-gray-50">{selectedModel.motorPower} W</div>
                      )}
                      {typeof selectedModel.range === 'number' && (
                        <div className="rounded-full border px-3 py-1 bg-gray-50">{selectedModel.range} km</div>
                      )}
                      {selectedModel.topSpeed && (
                        <div className="rounded-full border px-3 py-1 bg-gray-50">{selectedModel.topSpeed} km/h</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Station block */}
              {showStationSelect && (
                <div className="rounded-xl border">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <span className="font-medium">{t('vehicle_form.select_station')}</span>
                    <span className="text-xs text-gray-500">
                      {filteredStations.length} {t('vehicle_form.items') ?? 'items'}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <Input
                      placeholder={t('vehicle_form.search_station_placeholder')}
                      value={stationSearch}
                      onChange={(e) => setStationSearch(e.target.value)}
                    />
                    <SimpleSelect
                      options={filteredStations.map((s) => ({ label: s.name, value: s.id }))}
                      placeholder={t('vehicle_form.select_station')}
                      value={newVehicle.stationId || ''}
                      onChange={(val) => handleChange('stationId', val)}
                      disabled={filteredStations.length === 0}
                    />
                    {filteredStations.length === 0 && (
                      <div className="text-xs text-amber-600">
                        {t('vehicle_form.no_stations_hint', 'No stations found')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Serial / VIN / Plate Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">{t('vehicle_form.serial_number')}</label>
                <Input
                  placeholder={t('vehicle_form.serial_number')}
                  value={newVehicle.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">{t('vehicle_form.vehicle_id')}</label>
                <Input
                  placeholder={t('vehicle_form.vehicle_id')}
                  value={newVehicle.vehicleID}
                  onChange={(e) => handleChange('vehicleID', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">{t('vehicle_form.plate_number')}</label>
                <Input
                  placeholder={t('vehicle_form.plate_number')}
                  value={newVehicle.plateNumber}
                  onChange={(e) => handleChange('plateNumber', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== Specifications Card ===== */}
        <section className="bg-white rounded-2xl shadow border">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">
              {t('vehicle_form.section_specifications')}
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.odo')}</label>
              <Input
                type="number"
                placeholder={t('vehicle_form.odo')}
                value={newVehicle.odo || ''}
                onChange={(e) => handleChange('odo', e.target.valueAsNumber || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.color')}</label>
              <Input
                placeholder={t('vehicle_form.color')}
                value={newVehicle.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.battery_capacity')}</label>
              <Input
                placeholder={t('vehicle_form.battery_capacity')}
                value={newVehicle.batteryCapacity || ''}
                onChange={(e) => handleChange('batteryCapacity', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.range')}</label>
              <Input
                type="number"
                placeholder={t('vehicle_form.range')}
                value={newVehicle.range || ''}
                onChange={(e) => handleChange('range', e.target.valueAsNumber || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.select_status')}</label>
              <SimpleSelect
                options={statusOptions}
                placeholder={t('vehicle_form.select_status')}
                value={newVehicle.status}
                onChange={(val) => handleChange('status', val as VehicleStatus)}
              />
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs text-gray-500">{t('vehicle_form.current_location')}</label>
              <Textarea
                placeholder={t('vehicle_form.current_location')}
                value={newVehicle.currentLocation}
                onChange={(e) => handleChange('currentLocation', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ===== Pricing Card ===== */}
        <section className="bg-white rounded-2xl shadow border">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">
              {t('vehicle_form.section_pricing')}
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.price_hour')}</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.price_day')}</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.price_week')}</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">{t('vehicle_form.price_month')}</label>
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
            </div>
          </div>
        </section>

        {/* ===== Note Card ===== */}
        <section className="bg-white rounded-2xl shadow border">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-800">
              {t('vehicle_form.section_note')}
            </h3>
          </div>
          <div className="p-5">
            <Textarea
              placeholder={t('vehicle_form.note_placeholder')}
              value={newVehicle.note || ''}
              onChange={(e) => handleChange('note', e.target.value)}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSubmit}>
            {isUpdateMode ? t('vehicle_form.btn_save') : t('vehicle_form.btn_add')}
          </Button>
        </div>
      </div>
    </div>
  );
}
