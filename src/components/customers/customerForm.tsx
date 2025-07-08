'use client';

import { Customer } from '@/src/lib/customers/customerTypes';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useMemo } from 'react';

type Props = {
  editingCustomer: Customer | null;
  newCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
  setNewCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSave: () => void;
  onCancel: () => void;
  companyMap: Record<string, string>; // 👈 Thêm map từ companyId => companyName
};

export default function CustomerForm({
  editingCustomer,
  newCustomer,
  setNewCustomer,
  onSave,
  onCancel,
  companyMap,
}: Props) {
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

  return (
    <div className="bg-gray-100 rounded p-4 mb-6 mt-4">
      <h2 className="text-xl font-semibold mb-2">
        {editingCustomer ? 'Update Customer' : 'Add New Customer'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Full Name"
          value={newCustomer.name ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="email"
          placeholder="Email"
          value={newCustomer.email ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={newCustomer.phone ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          className="border p-2 rounded w-full"
        />
        {/* 👇 Trường Company Name readonly */}
        <input
          type="text"
          placeholder="Company Name"
          value={companyMap[newCustomer.companyId] || 'Unknown Company'}
          disabled
          className="border p-2 rounded w-full bg-gray-100 text-gray-700 font-medium"
        />
        <input
          type="text"
          placeholder="Address"
          value={newCustomer.address ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="date"
          placeholder="Date of Birth"
          value={formattedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Driver License Number"
          value={newCustomer.driverLicense ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, driverLicense: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Citizen ID / Passport Number"
          value={newCustomer.idNumber ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, idNumber: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Nationality"
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
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <input
          type="text"
          placeholder="Place of Origin"
          value={newCustomer.placeOfOrigin ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, placeOfOrigin: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Place of Residence"
          value={newCustomer.placeOfResidence ?? ''}
          onChange={(e) => setNewCustomer({ ...newCustomer, placeOfResidence: e.target.value })}
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="mt-4 flex gap-4">
        <button
          onClick={onSave}
          className="bg-[#00d289] text-white px-4 py-1 rounded"
        >
          {editingCustomer ? 'Update' : 'Add'}
        </button>
        {editingCustomer && (
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-1 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
