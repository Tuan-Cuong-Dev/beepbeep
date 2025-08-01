'use client';

import { Accessory } from '@/src/lib/accessories/accessoryTypes';
import { Input } from '@/src/components/ui/input';
import { importAccessories } from '@/src/lib/accessories/importAccessories';
import { exportAccessoriesToExcel } from '@/src/lib/accessories/exportAccessories';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/ui/button';
import { useUser } from '@/src/context/AuthContext'; // ✅ thêm

interface Props {
  accessories: Accessory[];
  setAccessories?: Dispatch<SetStateAction<Accessory[]>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

export default function AccessorySearchImportExport({
  accessories,
  setAccessories,
  searchTerm,
  setSearchTerm,
}: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser(); // ✅ lấy role từ context
  const isTechnician = role === 'technician';

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setAccessories) return;

    try {
      const imported = await importAccessories(file);
      if (Array.isArray(imported)) {
        setAccessories((prev) => [...prev, ...imported]);
      } else {
        console.warn(t('accessory_search_import_export.not_array_warning'));
      }
    } catch (error) {
      console.error(error);
      alert(t('accessory_search_import_export.import_failed'));
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('accessory_search_import_export.search_placeholder')}
        className="w-full md:w-64"
      />

      <div className="flex gap-2 items-center">
        {setAccessories && (
          <>
            <label htmlFor="accessory-import">
              <Button variant="outline" asChild>
                <span>{t('accessory_search_import_export.import')}</span>
              </Button>
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

        {!isTechnician && (
          <Button variant="default" onClick={() => exportAccessoriesToExcel(accessories)}>
            {t('accessory_search_import_export.export')}
          </Button>
        )}
      </div>
    </div>
  );
}
