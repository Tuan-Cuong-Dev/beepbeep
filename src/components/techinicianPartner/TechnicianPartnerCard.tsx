'use client';

import Image from 'next/image';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { PhoneCall, Star, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  partner: TechnicianPartner;
  onContact?: () => void;
  userLocation?: [number, number];
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TechnicianPartnerCard({ partner, onContact, userLocation }: Props) {
  const { t } = useTranslation('common');
  const avatar = partner.avatarUrl || '/assets/images/technician.png';

  const roleLabel = partner.type === 'shop'
    ? t('technician_partner_card.shop_technician')
    : t('technician_partner_card.mobile_technician');

  const fullAddress = partner.shopAddress || t('technician_partner_card.address_not_available');

  const distanceText =
    partner.coordinates && userLocation
      ? `📍 ${t('technician_partner_card.distance', {
          km: Math.round(
            haversineDistance(
              userLocation[0],
              userLocation[1],
              partner.coordinates.lat,
              partner.coordinates.lng
            ) * 10
          ) / 10,
        })}`
      : '';

  const ratingText = t('technician_partner_card.rating', {
    rating: partner.averageRating?.toFixed(1) || 'N/A',
    count: partner.ratingCount || 0,
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col h-full hover:shadow-xl transition-all">
      {/* Avatar + Name + Role */}
      <div className="flex items-start gap-3 mb-2 w-full">
        {/* Avatar */}
        <div className="w-1/3 flex justify-start">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300">
            <Image
              src={avatar}
              alt={partner.name}
              width={64}
              height={64}
              className="object-cover w-full h-full rounded-full"
            />
          </div>
        </div>

        {/* Name + Role */}
        <div className="w-2/3">
          <h3 className="text-base font-semibold text-gray-800 leading-tight">{partner.name}</h3>
          <p className="text-sm text-gray-600 leading-tight">{roleLabel}</p>
        </div>
      </div>

      {/* Address */}
      <div className="text-sm text-gray-600 mt-1 flex items-start gap-1 w-full">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{fullAddress}</span>
      </div>

      {/* Distance */}
      {distanceText && (
        <p className="text-xs text-green-700 mt-1">{distanceText}</p>
      )}

      {/* Rating */}
      <p className="text-sm text-yellow-600 mt-2 w-full">
        <Star className="inline-block w-4 h-4 mr-1" />
        {ratingText}
      </p>

      {/* Call / Contact Button */}
      <div className="mt-auto w-full pt-3">
        {partner.phone ? (
          <a href={`tel:${partner.phone}`} className="w-full block">
            <Button
              size="sm"
              variant="greenOutline"
              className="w-full px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              {t('technician_partner_card.call_now')}
            </Button>
          </a>
        ) : (
          <Button
            size="sm"
            variant="greenOutline"
            onClick={onContact}
            className="w-full px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            {t('technician_partner_card.contact')}
          </Button>
        )}
      </div>
    </div>
  );
}
