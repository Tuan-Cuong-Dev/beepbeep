'use client';

import { Customer } from '@/src/lib/customers/customerTypes';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext'; // ✅ lấy role

type Props = {
  editingCustomer: Customer | null;
  newCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
  setNewCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSave: () => void;
  onCancel: () => void;
  companyMap: Record<string, string>;
};

export default function CustomerForm({
  editingCustomer,
  newCustomer,
  setNewCustomer,
  onSave,
  onCancel,
  companyMap,
}: Props) {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const isAdmin = user?.role === 'admin'; // ✅ chỉ admin mới thấy field Công ty

  const handleDateChange = (value: string) => {
    const date = value ? new Date(value + 'T00:00:00') : null;
    setNewCustomer({
      ...newCustomer,
      dateOfBirth: date ? Timestamp.fromDate(date) : null,
    });
  };

  const formattedDate = useMemo(() => {
    return newCustomer.dateOfBirth
      ? format(newCustomer.dateOfBirth.toDate(), 'yyyy-MM-dd')
      : '';
  }, [newCustomer.dateOfBirth]);

  // ✅ chuyển companyMap => options để admin chọn
  const companyOptions = useMemo(
    () => Object.entries(companyMap).map(([id, name]) => ({ id, name })),
    [companyMap]
  );

  return (
    <div className="bg-gray-100 rounded p-4 mb-6 mt-4">
      <h2 className="text-xl font-semibold mb-2">
        {editingCustomer ? t('customer_form.title_update') : t('customer_form.title_add')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder={t('customer_form.full_name')}
          value={newCustomer.name ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <input
          type="email"
          placeholder={t('customer_form.email')}
          value={newCustomer.email ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder={t('customer_form.phone')}
          value={newCustomer.phone ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          className="border p-2 rounded w-full"
        />

        {/* ✅ Chỉ admin mới thấy & chỉnh company */}
        {isAdmin && (
          <select
            value={newCustomer.companyId ?? ''}
            onChange={(e) => setNewCustomer({ ...newCustomer, companyId: e.target.value || undefined })}
            className="border p-2 rounded w-full"
          >
            <option value="">{t('customer_form.company_name')}</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder={t('customer_form.address')}
          value={newCustomer.address ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <input
          type="date"
          placeholder={t('customer_form.date_of_birth')}
          value={formattedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder={t('customer_form.driver_license')}
          value={newCustomer.driverLicense ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, driverLicense: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder={t('customer_form.id_number')}
          value={newCustomer.idNumber ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, idNumber: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder={t('customer_form.nationality')}
          value={newCustomer.nationality ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, nationality: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <select
          value={newCustomer.sex ?? ''}
          onChange={(e) =>
            setNewCustomer({
              ...newCustomer,
              sex: e.target.value as 'male' | 'female' | 'other' | undefined,
            })
          }
          className="border p-2 rounded w-full"
        >
          <option value="">{t('customer_form.sex.placeholder')}</option>
          <option value="male">{t('customer_form.sex.male')}</option>
          <option value="female">{t('customer_form.sex.female')}</option>
          <option value="other">{t('customer_form.sex.other')}</option>
        </select>

        <input
          type="text"
          placeholder={t('customer_form.place_of_origin')}
          value={newCustomer.placeOfOrigin ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, placeOfOrigin: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder={t('customer_form.place_of_residence')}
          value={newCustomer.placeOfResidence ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, placeOfResidence: e.target.value })}
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={onSave} className="bg-[#00d289] text-white px-4 py-1 rounded">
          {editingCustomer ? t('customer_form.update') : t('customer_form.add')}
        </button>
        {editingCustomer && (
          <button onClick={onCancel} className="bg-gray-500 text-white px-4 py-1 rounded">
            {t('customer_form.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
