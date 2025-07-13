// MyInsuranceSection.tsx
'use client';

import MyInsurancePackagesSection from '../insurance/MyInsurancePackagesSection';
import AvailableInsuranceProductsSection from '../insurance/AvailableInsuranceProductsSection';

export default function MyInsuranceSection() {
  return (
    <div className="space-y-8 p-4 border-t">
      <MyInsurancePackagesSection />
      <AvailableInsuranceProductsSection />
    </div>
  );
}
