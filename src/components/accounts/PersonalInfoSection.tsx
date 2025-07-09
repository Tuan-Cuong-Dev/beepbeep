import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AccountFormData } from './AccountForm.types';

interface Props {
  register: UseFormRegister<AccountFormData>;
  errors: FieldErrors<AccountFormData>;
}

export default function PersonalInfoSection({ register, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>First Name</Label>
        <Input {...register('firstName')} placeholder="Enter first name" />
        {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
      </div>

      <div>
        <Label>Last Name</Label>
        <Input {...register('lastName')} placeholder="Enter last name" />
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
      </div>

      <div className="md:col-span-2">
        <Label>Full Name</Label>
        <Input {...register('name')} placeholder="Enter full name" />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <Label>Gender</Label>
        <select {...register('gender')} className="w-full border rounded p-2">
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
      </div>

      <div>
        <Label>Date of Birth</Label>
        <Input type="date" {...register('dateOfBirth')} />
      </div>

      <div>
        <Label>ID Number</Label>
        <Input {...register('idNumber')} placeholder="Enter ID number" />
      </div>

      <div>
        <Label>Phone</Label>
        <Input {...register('phone')} placeholder="Enter phone number" />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
      </div>
    </div>
  );
}