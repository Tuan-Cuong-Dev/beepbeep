// components/public/TechnicianPartnerCard.tsx
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

export default function TechnicianPartnerCard({ partner }: { partner: TechnicianPartner }) {
  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <h2 className="text-xl font-semibold">{partner.name}</h2>
      <p className="text-sm text-gray-600">Type: {partner.type === 'mobile' ? 'Mobile Service' : 'Shop'}</p>
      {partner.shopAddress && <p className="text-sm">Address: {partner.shopAddress}</p>}
      <p className="text-sm">Phone: {partner.phone}</p>
      <p className="text-sm">Regions: {partner.assignedRegions?.join(', ')}</p>
      <p className="text-sm text-green-600">Services: {partner.serviceCategories?.join(', ')}</p>
      <p className="text-sm text-yellow-600">Rating: {partner.averageRating ?? 'N/A'} ⭐</p>
    </div>
  );
}
