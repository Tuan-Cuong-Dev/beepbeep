'use client';

import { useEffect, useState } from 'react';
import { AccessoryExport } from '@/src/lib/accessories/accessoryExportTypes';
import { getUserNameById } from '@/src/lib/services/users/userService';
import { format } from 'date-fns';
import { Input } from '@/src/components/ui/input';
import { formatCurrency } from '@/src/utils/formatCurrency';
import Pagination from '@/src/components/ui/pagination'; // 👈 nếu bạn có component này

interface Props {
  exports: AccessoryExport[];
}

export default function AccessoryExportTable({ exports }: Props) {
  const [exportedByMap, setExportedByMap] = useState<Record<string, string>>({});
  const [searchName, setSearchName] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueIds = [...new Set(exports.map((e) => e.exportedBy))];
      const map: Record<string, string> = {};

      for (const uid of uniqueIds) {
        const name = await getUserNameById(uid);
        map[uid] = name;
      }

      setExportedByMap(map);
    };

    fetchUserNames();
  }, [exports]);

  // 🔽 Filter + Sort
  const filteredExports = exports
    .filter((item) =>
      item.accessoryName.toLowerCase().includes(searchName.toLowerCase()) &&
      (item.target || '').toLowerCase().includes(searchTarget.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.exportedAt?.toDate?.().getTime() ?? 0;
      const dateB = b.exportedAt?.toDate?.().getTime() ?? 0;
      return dateB - dateA; // newest first
    });

  // 🔽 Pagination
  const totalPages = Math.ceil(filteredExports.length / itemsPerPage);
  const paginatedExports = filteredExports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchTarget]);

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          placeholder="Search by accessory name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-full md:w-64"
        />
        <Input
          placeholder="Search by target..."
          value={searchTarget}
          onChange={(e) => setSearchTarget(e.target.value)}
          className="w-full md:w-64"
        />
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Accessory</th>
            <th className="p-2 text-left">Quantity</th>
            <th className="p-2 text-left">Target</th>
            <th className="p-2 text-left">Import Price</th>
            <th className="p-2 text-left">Retail Price</th>
            <th className="p-2 text-left">Note</th>
            <th className="p-2 text-left">Exported By</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {paginatedExports.map((item) => (
            <tr key={item.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{item.accessoryName}</td>
              <td className="p-2">{item.quantity}</td>
              <td className="p-2">{item.target || '-'}</td>
              <td className="p-2">
                {item.importPrice != null ? formatCurrency(item.importPrice) : '-'}
              </td>
              <td className="p-2">
                {item.retailPrice != null ? formatCurrency(item.retailPrice) : '-'}
              </td>
              <td className="p-2 whitespace-pre-line break-words">{item.note || '-'}</td>
              <td className="p-2">{exportedByMap[item.exportedBy] || '...'}</td>
              <td className="p-2">
                {item.exportedAt?.toDate
                  ? format(item.exportedAt.toDate(), 'dd/MM/yyyy')
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
