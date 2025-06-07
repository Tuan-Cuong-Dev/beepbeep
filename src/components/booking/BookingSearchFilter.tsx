'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

interface Props {
  onSearchChange: (searchText: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

// ✅ Đã thêm trạng thái "Returned"
const statusOptions = ['All', 'Draft', 'Confirmed', 'Returned', 'Completed', 'Cancelled'];

export default function BookingSearchFilter({
  onSearchChange,
  onStatusFilterChange,
  onDateRangeChange,
}: Props) {
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    onSearchChange(text);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    onStatusFilterChange(status);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    onDateRangeChange(value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    onDateRangeChange(startDate, value);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Row 1: Search + From Date + To Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          placeholder="Search by name, phone, or VIN..."
          value={searchText}
          onChange={handleSearchChange}
          className="w-full"
        />
        <Input type="date" value={startDate} onChange={handleStartDateChange} className="w-full" />
        <Input type="date" value={endDate} onChange={handleEndDateChange} className="w-full" />
      </div>

      {/* Row 2: Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            onClick={() => handleStatusChange(status)}
          >
            {status}
          </Button>
        ))}
      </div>
    </div>
  );
}
