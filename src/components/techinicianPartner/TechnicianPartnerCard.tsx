'use client';

import Image from 'next/image';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { PhoneCall, Star, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ===== Types & helpers =====
type LatLng = { lat: number; lng: number };

function toRad(x: number) {
  return (x * Math.PI) / 180;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const A =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * c;
}

function parseLocationString(input?: string): LatLng | null {
  if (!input) return null;
  // "lat,lng"
  const m1 = input.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[3]) };
  // "lat° N, lng° E"
  const m2 = input.match(/(-?\d+(\.\d+)?)°?\s*[NnSs]?,?\s*(-?\d+(\.\d+)?)°?\s*[EeWw]?/);
  if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[3]) };
  return null;
}

/** Đọc đủ biến thể LocationCore: GeoPoint, {lat,lng}, {geo}, {location:"lat,lng"}, string */
function extractLatLngFromLocationCore(loc: any): LatLng | null {
  if (!loc) return null;

  // GeoPoint trực tiếp
  if (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number') {
    return { lat: loc.latitude, lng: loc.longitude };
  }
  // { geo: GeoPoint }
  if (loc?.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  // { lat, lng }
  if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  // { location: "lat,lng" }
  if (typeof loc?.location === 'string') {
    return parseLocationString(loc.location);
  }
  // string "lat,lng"
  if (typeof loc === 'string') {
    return parseLocationString(loc);
  }
  return null;
}

/** Chuẩn hoá userLocation: nhận [lat,lng] hoặc {lat,lng} hoặc {geo} hoặc GeoPoint */
function normalizeUserLocation(u: any): LatLng | null {
  if (!u) return null;

  if (Array.isArray(u) && u.length === 2 && typeof u[0] === 'number' && typeof u[1] === 'number') {
    return { lat: u[0], lng: u[1] };
  }
  if (typeof u?.lat === 'number' && typeof u?.lng === 'number') {
    return { lat: u.lat, lng: u.lng };
  }
  if (typeof u?.geo?.latitude === 'number' && typeof u?.geo?.longitude === 'number') {
    return { lat: u.geo.latitude, lng: u.geo.longitude };
  }
  if (typeof u?.latitude === 'number' && typeof u?.longitude === 'number') {
    return { lat: u.latitude, lng: u.longitude };
  }
  if (typeof u?.location === 'string') {
    return parseLocationString(u.location);
  }
  return null;
}

interface Props {
  partner: TechnicianPartner;
  onContact?: () => void;
  /** Hỗ trợ: [lat,lng] | {lat,lng} | {geo} | GeoPoint | {location:"lat,lng"} */
  userLocation?: any;
}

export default function TechnicianPartnerCard({ partner, onContact, userLocation }: Props) {
  const { t } = useTranslation('common');
  const avatar = partner.avatarUrl || '/assets/images/technician.png';

  const roleLabel =
    partner.type === 'shop'
      ? t('technician_partner_card.shop_technician')
      : t('technician_partner_card.mobile_technician');

  const address =
    partner.location?.address ??
    partner.shopAddress ??
    t('technician_partner_card.address_not_available');

  const partnerLatLng = extractLatLngFromLocationCore(partner.location);
  const userLatLng = normalizeUserLocation(userLocation);

  const distanceText =
    partnerLatLng && userLatLng
      ? `📍 ${t('technician_partner_card.distance', {
          km: Math.round(haversineKm(userLatLng, partnerLatLng) * 10) / 10,
        })}`
      : '';

  const ratingText = t('technician_partner_card.rating', {
    rating: partner.averageRating?.toFixed(1) ?? 'N/A',
    count: partner.ratingCount ?? 0,
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
              alt={partner.name || 'Technician'}
              width={64}
              height={64}
              className="object-cover w-full h-full rounded-full"
            />
          </div>
        </div>

        {/* Name + Role */}
        <div className="w-2/3">
          <h3 className="text-base font-semibold text-gray-800 leading-tight">
            {partner.name}
          </h3>
          <p className="text-sm text-gray-600 leading-tight">{roleLabel}</p>
        </div>
      </div>

      {/* Address */}
      <div className="text-sm text-gray-600 mt-1 flex items-start gap-1 w-full">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{address}</span>
      </div>

      {/* Distance */}
      {distanceText && <p className="text-xs text-green-700 mt-1">{distanceText}</p>}

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
