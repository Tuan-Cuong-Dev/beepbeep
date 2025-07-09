import { Label } from '@/src/components/ui/label';
import { SimpleSelect } from '@/src/components/ui/select';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AccountFormData } from './AccountForm.types';

interface Props {
  register: UseFormRegister<AccountFormData>;
  errors: FieldErrors<AccountFormData>;
}

export default function PreferencesSection({ register }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Language</Label>
        <select {...register('preferences.language')} className="w-full border rounded p-2">
          <option value="en">English</option>
          <option value="vi">Vietnamese</option>
          <option value="ko">Korean</option>
        </select>
      </div>

      <div>
        <Label>Region</Label>
        <select {...register('preferences.region')} className="w-full border rounded p-2">
          <option value="VN">Vietnam</option>
          <option value="KR">South Korea</option>
          <option value="US">United States</option>
        </select>
      </div>

      <div>
        <Label>Currency</Label>
        <select {...register('preferences.currency')} className="w-full border rounded p-2">
          <option value="VND">VND</option>
          <option value="USD">USD</option>
          <option value="KRW">KRW</option>
        </select>
      </div>
    </div>
  );
}