// 📄 components/ebikes/ApplyModelPricingButton.tsx
'use client';

import { Button } from '@/src/components/ui/button';
import { applyPricingFromModelsToVehicles } from '@/src/lib/ebikes/applyModelPricingService';
import { useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { toast } from 'react-hot-toast'; // or use your NotificationDialog

export default function ApplyModelPricingButton() {
  const { companyId } = useUser();
  const [loading, setLoading] = useState(false);

  const handleApplyPricing = async () => {
    if (!companyId) {
      toast.error('Company ID not found!');
      return;
    }

    setLoading(true);
    const res = await applyPricingFromModelsToVehicles(companyId);
    setLoading(false);

    if (res.success) {
      toast.success(`Updated pricing for ${res.updatedCount} vehicles.`);
    } else {
      toast.error('Failed to apply pricing.');
    }
  };

  return (
    <Button
      onClick={handleApplyPricing}
      disabled={loading}
      className="bg-[#00d289] text-white hover:bg-[#00b070]"
    >
      {loading ? 'Applying...' : 'Apply Pricing from Models'}
    </Button>
  );
}
