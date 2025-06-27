'use client';

import Image from 'next/image';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { PhoneCall, Star } from 'lucide-react';

interface Props {
  partner: TechnicianPartner;
  onContact?: () => void;
}

export default function TechnicianPartnerCard({ partner, onContact }: Props) {
  const services = partner.serviceCategories ?? [];
  const fullAddress = partner.shopAddress || 'N/A';
  const avatar = partner.avatarUrl || '/assets/images/technician.png';
  const roleLabel = partner.type === 'shop' ? 'Shop Technician' : 'Mobile Technician';

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center text-center h-full hover:shadow-xl transition-all">
      <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-300">
        <Image
          src={avatar}
          alt={partner.name}
          width={80}
          height={80}
          className="object-cover w-full h-full"
        />
      </div>

      <h3 className="text-lg font-semibold mt-3 text-gray-800">{partner.name}</h3>
      <p className="text-sm text-gray-600 capitalize">{roleLabel}</p>

      <p className="text-sm text-green-700 mt-1">
        {partner.assignedRegions?.join(', ') || 'N/A'}
      </p>

      <p className="text-xs text-gray-500 italic mt-1">{fullAddress}</p>

      {services.length > 0 && (
        <div className="text-xs text-gray-600 mt-3 w-full">
          <p className="font-medium text-gray-700 mb-1">Services:</p>
          <ul className="list-disc list-inside text-left">
            {services.slice(0, 3).map((cat, i) => (
              <li key={i}>{cat}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-yellow-600 mt-2">
        <Star className="inline-block w-4 h-4 mr-1" />
        {partner.averageRating?.toFixed(1) || 'N/A'} ({partner.ratingCount || 0})
      </p>

      <div className="mt-auto w-full pt-4 flex justify-center">
        <Button
          size="sm"
          variant="greenOutline"
          onClick={onContact}
          className="px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full flex items-center gap-2"
        >
          <PhoneCall className="w-4 h-4" />
          Contact
        </Button>
      </div>
    </div>
  );
}
