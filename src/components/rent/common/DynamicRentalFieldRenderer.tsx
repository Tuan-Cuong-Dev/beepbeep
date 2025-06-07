'use client';

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
          placeholder="Search by VIN / Plate / Model"
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
                <div className="text-sm text-gray-500">{bike.modelName || 'Unknown Model'}</div>
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
        placeholder="Vehicle Model"
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
        Rental package
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
    basePrice: 'Base rental price (₫/day)',
    batteryFee: 'Battery rental fee (₫)',
    deposit: 'Deposit amount (₫)',
    totalAmount: 'Total amount (auto-calculated)',
    remainingBalance: 'Remaining balance (auto-calculated)',
    overageRate: 'Overage rate (₫/km)',
  };

  if (['basePrice', 'deposit', 'overageRate', 'batteryFee', 'totalAmount', 'remainingBalance'].includes(field.key)) {
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

  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'time':
      return (
        <Input
          key={field.key}
          type={field.type}
          placeholder={field.label}
          value={formData[field.key] || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
        />
      );
    case 'textarea':
      return (
        <Textarea
          key={field.key}
          placeholder={field.label}
          value={formData[field.key] || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
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
        <SimpleSelect
          key={field.key}
          options={(field.options || []).map(opt => ({ label: opt, value: opt }))}
          value={formData[field.key] || ''}
          onChange={(val) => handleChange(field.key, val)}
          placeholder={field.label}
        />
      );
    default:
      return null;
  }
}
