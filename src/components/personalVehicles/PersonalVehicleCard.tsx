'use client';

import Image from 'next/image';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';
import { Button } from '@/src/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicle: PersonalVehicle_new;
  onEdit?: (v: PersonalVehicle_new) => void;
  onDelete?: (v: PersonalVehicle_new) => void;
}

// 🔧 Convert Google Drive link to direct image URL
const getDirectImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  const id = match?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
};

export default function PersonalVehicleCard({ vehicle, onEdit, onDelete }: Props) {
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
    modelImageUrl,
  } = vehicle;

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white text-sm">
      <div className="flex gap-3 items-start">
        {/* Image */}
        {modelImageUrl ? (
          <Image
            src={getDirectImageUrl(modelImageUrl) as string}
            alt={name}
            width={80}
            height={60}
            className="rounded object-cover w-[80px] h-[60px]"
          />
        ) : (
          <div className="w-[80px] h-[60px] bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">
            {t('personal_vehicle_card.no_image')}
          </div>
        )}

        {/* Vehicle Info */}
        <div className="flex-1">
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-gray-500">
            {brand || t('personal_vehicle_card.unknown')} · {model || t('personal_vehicle_card.unknown')}
          </p>

          {licensePlate && (
            <p className="text-sm mt-1">
              {t('personal_vehicle_card.plate')}: {licensePlate}
            </p>
          )}

          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
            {odo !== undefined && <p>{t('personal_vehicle_card.odo')}: {odo.toLocaleString()} km</p>}
            {yearOfManufacture && <p>{t('personal_vehicle_card.year')}: {yearOfManufacture}</p>}
            <p>{t('personal_vehicle_card.type')}: {vehicleType}</p>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex justify-between items-center mt-3 text-xs">
        <span
          className={`px-2 py-0.5 rounded ${
            isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {isActive ? t('personal_vehicle_card.active') : t('personal_vehicle_card.inactive')}
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
            <Trash2 className="w-4 h-4 mr-1" /> {t('personal_vehicle_card.delete')}
          </Button>
        )}
      </div>
    </div>
  );
}
