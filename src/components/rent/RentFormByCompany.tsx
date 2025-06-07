'use client';
// Form thuê xe theo công ty
import { useUser } from '@/src/context/AuthContext';
import DynamicRentalForm from '@/src/components/rent/DynamicRentalForm';

export default function RentFormByCompany() {
  const { user, companyId, role, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user || !companyId) return <div>Access denied</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">🛵 Rent a Bike</h1>
      <DynamicRentalForm companyId={companyId} userId={user.uid} />
    </div>
  );
}
