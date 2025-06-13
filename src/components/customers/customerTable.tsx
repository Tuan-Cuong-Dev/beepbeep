'use client';

import { Customer } from '@/src/lib/customers/customerTypes';
import { Button } from '@/src/components/ui/button';

type Props = {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  companyMap: Record<string, string>;
};

export default function CustomerTable({ customers, onEdit, onDelete, searchTerm, setSearchTerm, companyMap }: Props) {
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border mb-4 p-2 rounded w-full"
      />

      <div className="border p-6 rounded shadow-lg bg-white overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-1">Name</th>
              <th className="border px-3 py-1">Email</th>
              <th className="border px-3 py-1">Phone</th>
              <th className="border px-3 py-1">Company</th> {/* ✅ Thêm cột */}
              <th className="border px-3 py-1">Address</th>
              <th className="border px-3 py-1 whitespace-nowrap">Place of Residence</th>
              <th className="border px-3 py-1 whitespace-nowrap">Place of Origin</th>
              <th className="border px-3 py-1">Nationality</th>
              <th className="border px-3 py-1">Sex</th>
              <th className="border px-3 py-1 whitespace-nowrap">Date of Birth</th>
              <th className="border px-3 py-1">ID Number</th>
              <th className="border px-3 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-100">
                <td className="border px-3 py-1 whitespace-nowrap">{c.name}</td>
                <td className="border px-3 py-1">{c.email}</td>
                <td className="border px-3 py-1">{c.phone}</td>
                <td className="border px-3 py-1 whitespace-nowrap">
                  {companyMap[c.companyId] || 'Unknown'} {/* ✅ Hiển thị tên công ty */}
                </td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.address}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.placeOfResidence || ''}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.placeOfOrigin || ''}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.nationality || ''}</td>
                <td className="border px-3 py-1">{c.sex || ''}</td>
                <td className="border px-3 py-1">
                  {c.dateOfBirth?.toDate().toLocaleDateString('vi-VN') || 'N/A'}
                </td>
                <td className="border px-3 py-1">{c.idNumber}</td>
                <td className="border px-3 py-1 flex gap-2">
                  <Button size="sm" onClick={() => onEdit(c)} className="bg-[#00d289] hover:bg-green-600 text-white">
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
