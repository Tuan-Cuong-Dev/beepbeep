'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Timestamp } from 'firebase/firestore';
import { differenceInDays, format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface ExtendRentalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newEndTime: Timestamp) => void;
  rentalStartDate: Timestamp | string;
  oldRentalEndDate: Timestamp | string;
  pricePerDay: number;
  deposit: number;
}

export default function ExtendRentalModal({
  open,
  onClose,
  onConfirm,
  rentalStartDate,
  oldRentalEndDate,
  pricePerDay,
  deposit,
}: ExtendRentalModalProps) {
  const { t } = useTranslation('common');
  const [newTime, setNewTime] = useState('');

  const rentalStart =
    typeof rentalStartDate === 'string'
      ? new Date(rentalStartDate)
      : rentalStartDate.toDate();

  const oldEnd =
    typeof oldRentalEndDate === 'string'
      ? new Date(oldRentalEndDate)
      : oldRentalEndDate.toDate();

  const newEnd = useMemo(() => (newTime ? new Date(newTime) : null), [newTime]);

  const oldDays = differenceInDays(oldEnd, rentalStart);
  const newDays = newEnd ? differenceInDays(newEnd, rentalStart) : oldDays;
  const rentalDays = newDays > oldDays ? newDays : oldDays;
  const totalAmount = rentalDays * pricePerDay;
  const remainingBalance = totalAmount - (deposit || 0);

  const handleSubmit = () => {
    if (!newEnd || isNaN(newEnd.getTime())) return;
    onConfirm(Timestamp.fromDate(newEnd));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('extend_rental_modal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <strong>{t('extend_rental_modal.current_end_time')}:</strong>{' '}
              {format(oldEnd, 'dd/MM/yyyy HH:mm')}
            </p>
            <Label htmlFor="newEndTime">{t('extend_rental_modal.new_end_time')}</Label>
            <Input
              id="newEndTime"
              type="datetime-local"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-2 focus:ring-2 focus:ring-[#00d289]"
            />
          </div>

          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>{t('extend_rental_modal.price_per_day')}:</strong>{' '}
              {pricePerDay.toLocaleString()}₫
            </p>
            <p>
              <strong>{t('extend_rental_modal.original_duration')}:</strong>{' '}
              {t('extend_rental_modal.days', { count: oldDays })}
            </p>
            <p>
              <strong>{t('extend_rental_modal.new_duration')}:</strong>{' '}
              {t('extend_rental_modal.days', { count: newDays })}
            </p>
            <p>
              <strong>{t('extend_rental_modal.total_amount')}:</strong>{' '}
              {totalAmount.toLocaleString()}₫
            </p>
            <p>
              <strong>{t('extend_rental_modal.deposit')}:</strong>{' '}
              {deposit.toLocaleString()}₫
            </p>
            <p>
              <strong>{t('extend_rental_modal.remaining_after_extension')}:</strong>{' '}
              {newDays > oldDays ? `${remainingBalance.toLocaleString()}₫` : '—'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              {t('extend_rental_modal.cancel')}
            </Button>
            <Button
              className="bg-[#00d289] hover:bg-[#00b67a] text-white"
              onClick={handleSubmit}
              disabled={!newEnd || newDays <= oldDays}
            >
              {t('extend_rental_modal.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
