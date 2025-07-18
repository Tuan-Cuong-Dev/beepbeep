'use client';

import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Contribution } from './MyContributionsSection'; // hoặc truyền qua prop

interface EditContributionModalProps {
  open: boolean;
  onClose: () => void;
  contribution: Contribution | null;
}

export default function EditContributionModal({ open, onClose, contribution }: EditContributionModalProps) {
  if (!contribution) return null;

  const { type, id } = contribution;

  const renderForm = () => {
    switch (type) {
      case 'repair_shop':
        return <RepairShopEditForm id={id} onClose={onClose} />;
      case 'rental_shop':
        return <RentalShopEditForm id={id} onClose={onClose} />;
      case 'battery_station':
        return <BatteryStationEditForm id={id} onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa {type}</DialogTitle>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}
