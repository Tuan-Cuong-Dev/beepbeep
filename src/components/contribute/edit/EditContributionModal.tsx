'use client';

import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Contribution } from '@/src/components/profile/MyContributionsSection';
import { useTranslation } from 'react-i18next';

// Lazy load các form để tối ưu bundle
const RepairShopEditForm = dynamic(
  () => import('@/src/components/contribute/edit/RepairShopEditForm')
);
const RentalShopEditForm = dynamic(
  () => import('@/src/components/contribute/edit/RentalShopEditForm')
);
const BatteryStationEditForm = dynamic(
  () => import('@/src/components/contribute/edit/BatteryStationEditForm')
);

interface EditContributionModalProps {
  open: boolean;
  onClose: () => void;
  contribution: Contribution | null;
}

export default function EditContributionModal({
  open,
  onClose,
  contribution,
}: EditContributionModalProps) {
  const { t } = useTranslation('common');

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
        return (
          <p className="text-sm text-gray-500">
            {t('edit_contribution_modal.not_found')}
          </p>
        );
    }
  };

  const getTypeLabel = () =>
    t(`edit_contribution_modal.types.${type}` as const);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('edit_contribution_modal.title', { typeLabel: getTypeLabel() })}
          </DialogTitle>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}
