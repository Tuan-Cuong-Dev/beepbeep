'use client';

import { Button } from '@/src/components/ui/button';
import { applyPricingFromModelsToVehicles } from '@/src/lib/vehicles/applyModelPricingService';
import { useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { toast } from 'react-hot-toast'; // or use your NotificationDialog
import { useTranslation } from 'react-i18next';

export default function ApplyModelPricingButton() {
  const { t } = useTranslation('common');
  const { companyId } = useUser();
  const [loading, setLoading] = useState(false);

  const handleApplyPricing = async () => {
    if (!companyId) {
      toast.error(t('apply_model_pricing_button.Company ID not found!'));
      return;
    }

    setLoading(true);
    const res = await applyPricingFromModelsToVehicles(companyId);
    setLoading(false);

    if (res.success) {
      toast.success(t('apply_model_pricing_button.Updated pricing for', { count: res.updatedCount }));
    } else {
      toast.error(t('apply_model_pricing_button.Failed to apply pricing.'));
    }
  };

  return (
    <Button
      onClick={handleApplyPricing}
      disabled={loading}
      className="bg-[#00d289] text-white hover:bg-[#00b070]"
    >
      {loading ? t('apply_model_pricing_button.Applying...') : t('apply_model_pricing_button.Apply Pricing from Models')}
    </Button>
  );
}
