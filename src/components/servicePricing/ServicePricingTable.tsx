'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import * as XLSX from 'xlsx';

interface Props {
  servicePricings: ServicePricing[];
  onEdit: (item: ServicePricing) => void;
  onDelete: (id: string) => void;
}

export default function ServicePricingTable({ servicePricings, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const isTechnician = role === 'technician';
  const isTechnicianPartner = role === 'technician_partner';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const uniqueCategories = Array.from(
    new Set(servicePricings.map((s) => s.category).filter(Boolean))
  );

  const filtered = servicePricings.filter((item) => {
    const matchTitle = item.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchActive =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
        ? item.isActive
        : !item.isActive;
    return matchTitle && matchCategory && matchActive;
  });

  const handleExport = () => {
    const exportData = filtered.map((item) => ({
      [t('service_pricing_table.title')]: item.title,
      [t('service_pricing_table.category')]: item.category,
      [t('service_pricing_table.duration')]: item.durationEstimate,
      [t('service_pricing_table.price')]: item.price,
      [t('service_pricing_table.active')]: item.isActive ? t('service_pricing_table.active') : t('service_pricing_table.inactive'),
      [t('service_pricing_table.features')]: item.features.join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Service Pricings');
    XLSX.writeFile(wb, 'service_pricings.xlsx');
  };

  return (
    <div className="space-y-4">
      {/* Bộ lọc + tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Input
          placeholder={t('service_pricing_table.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-auto"
        >
          <option value="">{t('service_pricing_table.all_categories')}</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border px-3 py-2 rounded w-full sm:w-auto"
        >
          <option value="all">{t('service_pricing_table.all_status')}</option>
          <option value="active">{t('service_pricing_table.active_only')}</option>
          <option value="inactive">{t('service_pricing_table.inactive_only')}</option>
        </select>

        {!(isTechnician || isTechnicianPartner) && (
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            {t('service_pricing_table.export_excel')}
          </Button>
        )}
      </div>

      {/* Mobile View */}
      <div className="grid gap-4 sm:hidden">
        {filtered.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="font-semibold text-base mb-1">{item.title}</div>
            <div className="text-sm text-gray-600">{t('service_pricing_table.category')}: {item.category || '-'}</div>
            <div className="text-sm text-gray-600">{t('service_pricing_table.duration')}: {item.durationEstimate || '-'}</div>
            <div className="text-sm text-gray-600">
              {t('service_pricing_table.price')}: {item.price.toLocaleString('vi-VN')} VND
            </div>
            <div className="text-sm text-gray-600">
              {t('service_pricing_table.active')}:{' '}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium inline-block mt-1 ${
                  item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {item.isActive ? t('service_pricing_table.active') : t('service_pricing_table.inactive')}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {t('service_pricing_table.features')}: {item.features?.join(', ') || '-'}
            </div>
            {!(isTechnician || isTechnicianPartner) && (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                  {t('service_pricing_table.edit')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                  {t('service_pricing_table.delete')}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">{t('service_pricing_table.title')}</th>
              <th className="p-2 text-left">{t('service_pricing_table.category')}</th>
              <th className="p-2 text-left">{t('service_pricing_table.duration')}</th>
              <th className="p-2 text-left">{t('service_pricing_table.price')}</th>
              <th className="p-2 text-left">{t('service_pricing_table.active')}</th>
              <th className="p-2 text-left">{t('service_pricing_table.features')}</th>
              {!(isTechnician || isTechnicianPartner) && (
                <th className="p-2 text-right">{t('service_pricing_table.actions')}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{item.title}</td>
                <td className="p-2">{item.category || '-'}</td>
                <td className="p-2">{item.durationEstimate || '-'}</td>
                <td className="p-2 text-right">{item.price.toLocaleString('vi-VN')} VND</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.isActive ? t('service_pricing_table.active') : t('service_pricing_table.inactive')}
                  </span>
                </td>
                <td className="p-2">{item.features?.join(', ') || '-'}</td>
                {!(isTechnician || isTechnicianPartner) && (
                  <td className="p-2 text-right space-x-2 whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                      {t('service_pricing_table.edit')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                      {t('service_pricing_table.delete')}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
