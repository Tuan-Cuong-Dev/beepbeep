'use client';

import Image, { type StaticImageData } from 'next/image';
import { PersonalVehicle } from '@/src/lib/personalVehicles/personalVehiclesTypes';
import { Button } from '@/src/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Icon mặc định */
import bicycleIcon from '@/public/assets/images/vehicles/bicycle.png';
import busIcon from '@/public/assets/images/vehicles/bus.png';
import carIcon from '@/public/assets/images/vehicles/car.png';
import motorbikeIcon from '@/public/assets/images/vehicles/motorbike.png';
import vanIcon from '@/public/assets/images/vehicles/van.png';

/** SVG placeholder */
const placeholderIcon =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60" fill="none">
  <rect width="80" height="60" fill="white"/>
  <path d="M15 45H65L60 30H20L15 45Z" stroke="%2300d289" stroke-width="2" fill="none"/>
  <circle cx="25" cy="45" r="4" fill="%2300d289"/>
  <circle cx="55" cy="45" r="4" fill="%2300d289"/>
</svg>
`);

/** Map icon mặc định theo vehicleType */
const DEFAULT_ICONS: Record<string, StaticImageData> = {
  bicycle: bicycleIcon,
  bus: busIcon,
  car: carIcon,
  motorbike: motorbikeIcon,
  van: vanIcon,
};

// 🔧 Convert Google Drive link to direct image URL
const getDirectImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  const id = match?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
};

/** Ưu tiên ảnh model → icon mặc định → placeholder */
const resolveVehicleImage = (
  vehicle: PersonalVehicle
): string | StaticImageData => {
  return (
    getDirectImageUrl(vehicle.modelImageUrl) ||
    DEFAULT_ICONS[vehicle.vehicleType] ||
    placeholderIcon
  );
};

interface Props {
  vehicle: PersonalVehicle;
  onEdit?: (v: PersonalVehicle) => void;
  onDelete?: (v: PersonalVehicle) => void;
}

export default function PersonalVehicleCard({
  vehicle,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation('common');

  const {
    name,
    brand,
    model,
    licensePlate,
    odo,
    yearOfManufacture,
    vehicleType,
    isActive,
    isPrimary,
  } = vehicle;

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white text-sm">
      <div className="flex gap-3 items-start">
        {/* Vehicle Image */}
        <Image
          src={resolveVehicleImage(vehicle)}
          alt={name || model || vehicleType}
          width={80}
          height={60}
          className="rounded object-cover w-[80px] h-[60px] bg-gray-50 border"
        />

        {/* Vehicle Info */}
        <div className="flex-1">
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-gray-500">
            {brand || t('personal_vehicle_card.unknown')} ·{' '}
            {model || t('personal_vehicle_card.unknown')}
          </p>

          {licensePlate && (
            <p className="text-sm mt-1">
              {t('personal_vehicle_card.plate')}: {licensePlate}
            </p>
          )}

          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
            {odo !== undefined && (
              <p>
                {t('personal_vehicle_card.odo')}: {odo.toLocaleString()} km
              </p>
            )}
            {yearOfManufacture && (
              <p>
                {t('personal_vehicle_card.year')}: {yearOfManufacture}
              </p>
            )}
            <p>
              {t('personal_vehicle_card.type')}: {vehicleType}
            </p>
          </div>
        </div>
      </div>

      {/* Status & Primary */}
      <div className="flex justify-between items-center mt-3 text-xs">
        <span
          className={`px-2 py-0.5 rounded ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isActive
            ? t('personal_vehicle_card.active')
            : t('personal_vehicle_card.inactive')}
        </span>

        {isPrimary && (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
            🌟 {t('personal_vehicle_card.primary')}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mt-4">
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onEdit(vehicle)}
          >
            <Pencil className="w-4 h-4 mr-1" /> {t('personal_vehicle_card.edit')}
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            className="text-xs"
            onClick={() => onDelete(vehicle)}
          >
            <Trash2 className="w-4 h-4 mr-1" />{' '}
            {t('personal_vehicle_card.delete')}
          </Button>
        )}
      </div>
    </div>
  );
}
