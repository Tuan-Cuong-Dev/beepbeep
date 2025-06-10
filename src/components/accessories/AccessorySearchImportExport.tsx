'use client';

import { Accessory } from '@/src/lib/accessories/accessoryTypes';
import { Input } from '@/src/components/ui/input';
import { importAccessories } from '@/src/lib/accessories/importAccessories';
import { exportAccessoriesToExcel } from '@/src/lib/accessories/exportAccessories';
import { Dispatch, SetStateAction } from 'react';

interface Props {
  accessories: Accessory[];
  setAccessories?: Dispatch<SetStateAction<Accessory[]>>; // ✅ optional
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

export default function AccessorySearchImportExport({
  accessories,
  setAccessories,
  searchTerm,
  setSearchTerm,
}: Props) {
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setAccessories) return;

    try {
      const imported = await importAccessories(file);
      if (Array.isArray(imported)) {
        setAccessories((prev) => [...prev, ...imported]);
      } else {
        console.warn('Imported data is not an array');
      }
    } catch (error) {
      console.error('Failed to import accessories:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search accessory..."
        className="w-full md:w-64"
      />

      <div className="flex gap-2 items-center">
        {/* ✅ Chỉ hiện Import nếu có setAccessories */}
        {setAccessories && (
          <>
            <label
              htmlFor="accessory-import"
              className="cursor-pointer px-4 py-2 border border-[#00d289] text-[#00d289] font-semibold rounded hover:bg-[#e6fff5] transition"
            >
              Import
            </label>
            <input
              id="accessory-import"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </>
        )}

        <button
          onClick={() => exportAccessoriesToExcel(accessories)}
          className="px-4 py-2 bg-[#00d289] text-white font-semibold rounded hover:bg-[#00b67a] transition"
        >
          Export
        </button>
      </div>
    </div>
  );
}
