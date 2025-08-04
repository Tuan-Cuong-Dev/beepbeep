'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';

interface Props {
  onSearchChange: (searchText: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

const statusOptions = [
  'all',
  'draft',
  'confirmed',
  'returned',
  'completed',
  'cancelled',
];

export default function BookingSearchFilter({
  onSearchChange,
  onStatusFilterChange,
  onDateRangeChange,
}: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'booking_search_filter' });

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    onSearchChange(text);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    onStatusFilterChange(status);
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    onDateRangeChange(
      date ? date.toISOString().slice(0, 10) : '',
      endDate ? endDate.toISOString().slice(0, 10) : ''
    );
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    onDateRangeChange(
      startDate ? startDate.toISOString().slice(0, 10) : '',
      date ? date.toISOString().slice(0, 10) : ''
    );
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Row 1: Search + Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          placeholder={t('search_placeholder')}
          value={searchText}
          onChange={handleSearchChange}
        />
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          placeholderText={t('start_date_placeholder')}
          dateFormat="yyyy-MM-dd"
          className="w-full border rounded p-2 text-sm"
        />
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          placeholderText={t('end_date_placeholder')}
          dateFormat="yyyy-MM-dd"
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      {/* Row 2: Status Filter Buttons */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-[500px] sm:min-w-0">
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              onClick={() => handleStatusChange(status)}
              className="whitespace-nowrap"
            >
              {t(`status_${status}`)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
