'use client';

import { useTranslation } from 'react-i18next';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Checkbox } from '@/src/components/ui/checkbox';
import { SimpleSelect } from '@/src/components/ui/select';
import { FormField } from '@/src/lib/formConfigurations/formConfigurationTypes';
import IDUploader from './IDUploader';
import BatterySelector from './BatterySelector';
import PackageSelector from './PackageSelector';
import TimePicker from './TimePicker';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  field: FormField;
  formData: Record<string, any>;
  handleChange: (key: string, value: any) => void;
  bikeSuggestions: any[];
  populateVehicleSuggestions: (search: string) => void;
  handleSelectBike: (bike: any) => void;
  companyId: string;
}

export function DynamicRentalFieldRenderer({
  field,
  formData,
  handleChange,
  bikeSuggestions,
  populateVehicleSuggestions,
  handleSelectBike,
  companyId,
}: Props) {
  const { t } = useTranslation('common');

  if (!field.visible) return null;

  if (field.key === 'deliveryAddress' && formData.rentalMethod === 'Pickup at Store') {
    return null;
  }

  if (field.key === 'idImage') {
    return (
      <IDUploader
        key={field.key}
        onExtracted={({ name, idNumber }) => {
          handleChange('fullName', name);
          handleChange('idNumber', idNumber);
        }}
      />
    );
  }

  if (field.key === 'vehicleSearch') {
    return (
      <div key={field.key} className="space-y-2 relative">
        <Input
          placeholder={t('dynamic_rental_field_renderer.vehicle_search_placeholder')}
          value={formData[field.key] || ''}
          onChange={(e) => {
            const value = e.target.value;
            handleChange(field.key, value);
            populateVehicleSuggestions(value);
          }}
        />
        {bikeSuggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border rounded shadow-md mt-1 max-h-48 overflow-y-auto">
            {bikeSuggestions.map((bike) => (
              <li
                key={bike.id}
                className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                onClick={() => handleSelectBike(bike)}
              >
                <div className="font-semibold">
                  {bike.vehicleID} {bike.plateNumber && `- ${bike.plateNumber}`}
                </div>
                <div className="text-sm text-gray-500">{bike.modelName || t('dynamic_rental_field_renderer.unknown_model')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (field.key === 'vehicleModel') {
    return (
      <Input
        key={field.key}
        placeholder={t('dynamic_rental_field_renderer.vehicle_model')}
        value={formData[field.key] || ''}
        readOnly
        className="bg-gray-100 text-gray-600"
      />
    );
  }

  if (field.key.startsWith('batteryCode')) {
    return (
      <BatterySelector
        key={field.key}
        value={formData[field.key] || ''}
        onChange={(val) => handleChange(field.key, val)}
      />
    );
  }

  if (field.key.startsWith('package')) {
    return (
      <div key={field.key} className="space-y-1">
        <label className="text-sm text-gray-600 font-medium">
          {t('dynamic_rental_field_renderer.package')}
        </label>
        <PackageSelector
          value={formData[field.key] || ''}
          onChange={(val) => handleChange(field.key, val)}
          companyId={companyId}
        />
      </div>
    );
  }

  if (field.key === 'rentalSchedule') {
    return (
      <div key={field.key} className="space-y-4">
        <TimePicker
          onTimeSelected={({ rentalStartDate, rentalStartHour, rentalDays, rentalEndDate }) => {
            handleChange('rentalStartDate', rentalStartDate);
            handleChange('rentalStartHour', rentalStartHour);
            handleChange('rentalDays', rentalDays);
            handleChange('rentalEndDate', rentalEndDate);
          }}
        />
      </div>
    );
  }

  const placeholderMap: Record<string, string> = {
    basePrice: t('dynamic_rental_field_renderer.base_price'),
    batteryFee: t('dynamic_rental_field_renderer.battery_fee'),
    deposit: t('dynamic_rental_field_renderer.deposit'),
    totalAmount: t('dynamic_rental_field_renderer.total_amount'),
    remainingBalance: t('dynamic_rental_field_renderer.remaining_balance'),
    overageRate: t('dynamic_rental_field_renderer.overage_rate'),
  };

  if ([
    'basePrice',
    'deposit',
    'overageRate',
    'batteryFee',
    'totalAmount',
    'remainingBalance',
  ].includes(field.key)) {
    const rawValue = formData[field.key] || 0;
    const formattedValue = formatCurrency(rawValue);
    const isEditable = ['basePrice', 'deposit', 'overageRate', 'batteryFee'].includes(field.key);

    return (
      <div key={field.key} className="space-y-1">
        <label className="text-sm text-gray-600 font-medium">
          {placeholderMap[field.key] || field.label}
        </label>
        <Input
          type="text"
          value={formattedValue}
          readOnly={!isEditable}
          className={`${isEditable ? '' : 'bg-gray-100 text-gray-600 font-semibold'}`}
          onChange={(e) => {
            if (isEditable) {
              const numericValue = parseCurrencyString(e.target.value);
              handleChange(field.key, numericValue);
            }
          }}
        />
      </div>
    );
  }

  if (field.key === 'rentalStartDate' || field.key === 'rentalEndDate') {
    return (
      <div key={field.key} className="flex flex-col space-y-1 w-full">
        <label htmlFor={field.key} className="text-sm font-medium text-gray-700 block">
          {field.label}
        </label>
        <DatePicker
          id={field.key}
          selected={formData[field.key] ? new Date(formData[field.key]) : null}
          onChange={(date) =>
            handleChange(field.key, date?.toISOString().slice(0, 10) || '')
          }
          placeholderText={t('dynamic_rental_field_renderer.select_date')}
          dateFormat="yyyy-MM-dd"
          className="w-full text-base appearance-none px-3 py-2 border rounded"
        />
      </div>
    );
  }

  if (field.key === 'rentalStartHour') {
    return (
      <div key={field.key} className="flex flex-col space-y-1 w-full">
        <label htmlFor={field.key} className="text-sm font-medium text-gray-700 block">
          {field.label}
        </label>
        <DatePicker
          selected={
            formData[field.key] ? new Date(`1970-01-01T${formData[field.key]}`) : null
          }
          placeholderText={t('dynamic_rental_field_renderer.select_hour')}
          onChange={(date) => {
            const formatted = date?.toTimeString().slice(0, 5);
            handleChange(field.key, formatted || '');
          }}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={15}
          timeCaption="Time"
          dateFormat="HH:mm"
          className="w-full text-base appearance-none px-3 py-2 border rounded"
        />
      </div>
    );
  }

  switch (field.type) {
    case 'text':
    case 'number':
      return (
        <div key={field.key} className="space-y-1">
          <label className="text-sm text-gray-600 font-medium">{field.label}</label>
          <Input
            type={field.type}
            value={formData[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className="w-full text-base appearance-none px-3 py-2 border rounded"
          />
        </div>
      );
    case 'textarea':
      return (
        <Textarea
          key={field.key}
          placeholder={field.label}
          value={formData[field.key] || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-full text-base appearance-none px-3 py-2 border rounded"
        />
      );
    case 'checkbox':
      return (
        <label key={field.key} className="flex items-center gap-3">
          <Checkbox
            checked={!!formData[field.key]}
            onCheckedChange={(val) => handleChange(field.key, Boolean(val))}
          />
          <span>{field.label}</span>
        </label>
      );
    case 'select':
      return (
        <div key={field.key} className="flex flex-col space-y-1 w-full">
          <label htmlFor={field.key} className="text-sm font-medium text-gray-700 block">
            {field.label}
          </label>
          <SimpleSelect
            options={(field.options || []).map(opt => ({ label: opt, value: opt }))}
            value={formData[field.key] || ''}
            onChange={(val) => handleChange(field.key, val)}
            placeholder={t('dynamic_rental_field_renderer.select_prefix', { label: field.label })}
            className="w-full text-base appearance-none px-3 py-2 border rounded"
          />
        </div>
      );
    default:
      return null;
  }
}