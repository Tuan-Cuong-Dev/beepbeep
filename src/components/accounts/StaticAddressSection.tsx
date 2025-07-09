import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AccountFormData } from './AccountForm.types';

interface Props {
  register: UseFormRegister<AccountFormData>;
  errors: FieldErrors<AccountFormData>;
}

export default function StaticAddressSection({ register, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label>Address</Label>
        <Input {...register('address')} />
      </div>

      <div>
        <Label>City</Label>
        <Input {...register('city')} />
      </div>

      <div>
        <Label>State</Label>
        <Input {...register('state')} />
      </div>

      <div>
        <Label>ZIP</Label>
        <Input {...register('zip')} />
      </div>

      <div>
        <Label>Country</Label>
        <Input {...register('country')} />
      </div>
    </div>
  );
}