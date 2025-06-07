'use client';
// Trường xữ lý dữ liệu thời gian.
import { useEffect, useState } from 'react';
import { Calendar } from '@/src/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/src/components/ui/popover';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

interface TimePickerProps {
  onTimeSelected: (timeRange: { 
    rentalStartDate: string; 
    rentalStartHour: string; 
    rentalDays: number; 
    rentalEndDate: string;
  }) => void;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TimePicker({ onTimeSelected }: TimePickerProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [selectedHour, setSelectedHour] = useState<number>(now.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(now.getMinutes());
  const [rentalDays, setRentalDays] = useState<number>(1);

  useEffect(() => {
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(selectedHour);
    startDateTime.setMinutes(selectedMinute);
    startDateTime.setSeconds(0);
    startDateTime.setMilliseconds(0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + rentalDays);

    const startDateStr = formatDateTimeLocal(startDateTime); // ví dụ "2025-04-27T08:30"

    onTimeSelected({
      rentalStartDate: startDateStr.split('T')[0], // "2025-04-27"
      rentalStartHour: startDateStr.split('T')[1].slice(0, 5), // "08:30"
      rentalDays,
      rentalEndDate: formatDateTimeLocal(endDateTime).split('T')[0], // "2025-04-30"
    });
  }, [selectedDate, selectedHour, selectedMinute, rentalDays, onTimeSelected]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 📅 Chọn ngày */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                defaultMonth={selectedDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 🕒 Chọn giờ */}
        <div className="space-y-2">
          <Label>Start Time</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              max={23}
              value={selectedHour}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setSelectedHour(Math.max(0, Math.min(23, val)));
              }}
              className="w-1/2"
              placeholder="Hour"
            />
            <Input
              type="number"
              min={0}
              max={59}
              value={selectedMinute}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) setSelectedMinute(Math.max(0, Math.min(59, val)));
              }}
              className="w-1/2"
              placeholder="Minute"
            />
          </div>
        </div>
      </div>

      {/* 📅 Số ngày thuê */}
      <div className="space-y-2">
        <Label>Rental Days</Label>
        <Input
          type="number"
          min={1}
          value={rentalDays}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setRentalDays(isNaN(val) || val <= 0 ? 1 : val);
          }}
        />
      </div>
    </div>
  );
}
