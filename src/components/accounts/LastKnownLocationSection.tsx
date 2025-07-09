import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AccountFormData } from './AccountForm.types';

interface Props {
  register: UseFormRegister<AccountFormData>;
  errors: FieldErrors<AccountFormData>;
}

export default function LastKnownLocationSection({ register, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label>Last Known Address</Label>
        <Input {...register('lastKnownLocation.address')} />
      </div>

      <div>
        <Label>Latitude</Label>
        <Input type="number" step="any" {...register('lastKnownLocation.lat', { valueAsNumber: true })} />
        {errors.lastKnownLocation?.lat && (
          <p className="text-sm text-red-500">{errors.lastKnownLocation.lat.message}</p>
        )}
      </div>

      <div>
        <Label>Longitude</Label>
        <Input type="number" step="any" {...register('lastKnownLocation.lng', { valueAsNumber: true })} />
        {errors.lastKnownLocation?.lng && (
          <p className="text-sm text-red-500">{errors.lastKnownLocation.lng.message}</p>
        )}
      </div>
    </div>
  );
}