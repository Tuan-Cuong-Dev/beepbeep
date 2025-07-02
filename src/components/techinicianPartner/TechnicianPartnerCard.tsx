'use client';

import Image from 'next/image';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { PhoneCall, Star, MapPin } from 'lucide-react';

interface Props {
  partner: TechnicianPartner;
  onContact?: () => void;
  userLocation?: [number, number]; // ⬅️ Vị trí người dùng [lat, lng]
}

// 🎯 Tính khoảng cách giữa hai tọa độ
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Bán kính trái đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TechnicianPartnerCard({ partner, onContact, userLocation }: Props) {
  const services = partner.serviceCategories ?? [];
  const fullAddress = partner.shopAddress || 'N/A';
  const avatar = partner.avatarUrl || '/assets/images/technician.png';
  const roleLabel = partner.type === 'shop' ? 'Shop Technician' : 'Mobile Technician';

  // ✅ Tính khoảng cách nếu có vị trí người dùng và geo
  let distanceText = '';
  if (partner.geo && userLocation) {
    const dist = haversineDistance(
      userLocation[0],
      userLocation[1],
      partner.geo.lat,
      partner.geo.lng
    );
    distanceText = `📍 ${Math.round(dist * 10) / 10} km away`;
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center text-center h-full hover:shadow-xl transition-all">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-300">
        <Image
          src={avatar}
          alt={partner.name}
          width={80}
          height={80}
          className="object-cover w-full h-full rounded-full"
        />
      </div>

      {/* Name & Role */}
      <h3 className="text-lg font-semibold mt-3 text-gray-800">{partner.name}</h3>
      <p className="text-sm text-gray-600 capitalize">{roleLabel}</p>

      {/* Regions */}
      <p className="text-sm text-green-700 mt-1">
        {partner.assignedRegions?.join(', ') || 'N/A'}
      </p>

      {/* Address & Distance */}
      <div className="flex items-center justify-center text-xs text-gray-500 mt-1 gap-1 flex-wrap">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{fullAddress}</span>
        {distanceText && <span className="ml-2 text-gray-600 font-medium">{distanceText}</span>}
      </div>

      {/* Services */}
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

      {/* Rating */}
      <p className="text-sm text-yellow-600 mt-2">
        <Star className="inline-block w-4 h-4 mr-1" />
        {partner.averageRating?.toFixed(1) || 'N/A'} ({partner.ratingCount || 0})
      </p>

      {/* 📞 Contact */}
      <div className="mt-auto w-full pt-4 flex justify-center">
        {partner.phone ? (
          <a href={`tel:${partner.phone}`} className="w-full">
            <Button
              size="sm"
              variant="greenOutline"
              className="w-full px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              Call Now
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
            Contact
          </Button>
        )}
      </div>
    </div>
  );
}
