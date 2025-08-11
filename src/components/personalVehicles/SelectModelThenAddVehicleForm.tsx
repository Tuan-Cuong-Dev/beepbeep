'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { useAuth } from '@/src/hooks/useAuth';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { addPersonalVehicleWithModel } from '@/src/hooks/useAddPersonalVehicle';
import { useTranslation } from 'react-i18next';

/** ✅ Static imports cho icon mặc định */
import bicycleIcon from '@/public/assets/images/vehicles/bicycle.png';
import busIcon from '@/public/assets/images/vehicles/bus.png';
import carIcon from '@/public/assets/images/vehicles/car.png';
import motorbikeIcon from '@/public/assets/images/vehicles/motorbike.png';
import vanIcon from '@/public/assets/images/vehicles/van.png';

const placeholderIcon =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40" fill="none">
  <rect width="60" height="40" fill="white"/>
  <path d="M10 30H50L45 20H15L10 30Z" stroke="%2300d289" stroke-width="2" fill="none"/>
  <circle cx="18" cy="30" r="3" fill="%2300d289"/>
  <circle cx="42" cy="30" r="3" fill="%2300d289"/>
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

/** Convert link Google Drive thành link trực tiếp */
const getDirectImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  const id = match?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
};

/** Ưu tiên ảnh model → icon type → placeholder */
const resolveModelImage = (model: VehicleModel): string | StaticImageData => {
  return getDirectImageUrl(model.imageUrl) || DEFAULT_ICONS[model.vehicleType] || placeholderIcon;
};

interface Props {
  onSaved: () => void;
}

export default function SelectModelThenAddVehicleForm({ onSaved }: Props) {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();

  const [models, setModels] = useState<VehicleModel[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | undefined>();
  const [odo, setOdo] = useState<number | undefined>();
  const [licensePlate, setLicensePlate] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      const snap = await getDocs(collection(db, 'vehicleModels'));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VehicleModel[];
      setModels(list);
    };
    fetchModels();
  }, []);

  const filteredModels = models.filter((m) =>
    `${m.brand} ${m.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!currentUser || !selectedModel || !name) return;

    setLoading(true);
    try {
      await addPersonalVehicleWithModel({
        userId: currentUser.uid,
        modelId: selectedModel.id,
        name,
        vehicleType: selectedModel.vehicleType,
        brand: selectedModel.brand ?? '',
        model: selectedModel.name,
        licensePlate,
        yearOfManufacture: year,
        odo,
        isPrimary,
      });
      onSaved();
    } catch (err) {
      console.error('❌ Failed to save vehicle:', err);
      alert(t('select_model_then_add_vehicle_form.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded bg-white space-y-6">
      {!selectedModel ? (
        <>
          <h2 className="text-lg font-semibold">🔍 {t('select_model_then_add_vehicle_form.search_title')}</h2>
          <Input
            placeholder={t('select_model_then_add_vehicle_form.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="border p-3 rounded hover:bg-gray-50 cursor-pointer flex gap-2 items-center"
                onClick={() => setSelectedModel(model)}
              >
                <Image
                  src={resolveModelImage(model)}
                  alt={model.name || model.vehicleType}
                  width={60}
                  height={40}
                  className="rounded object-cover bg-gray-50 border w-[80px] h-[60px]"
                />
                <div>
                  <div className="font-medium">
                    {model.brand} {model.name}
                  </div>
                  <div className="text-xs text-gray-500">{model.vehicleType}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">🚗 {t('select_model_then_add_vehicle_form.add_title')}</h2>
          <div className="bg-gray-100 p-3 rounded flex items-center gap-2">
            <Image
              src={resolveModelImage(selectedModel)}
              alt={selectedModel.name || selectedModel.vehicleType}
              width={60}
              height={40}
              className="rounded object-cover bg-gray-50 border w-[60px] h-[40px]"
            />
            <div>
              <strong>{t('select_model_then_add_vehicle_form.selected')}:</strong>{' '}
              {selectedModel.brand} {selectedModel.name} ({selectedModel.vehicleType})
            </div>
          </div>

          <Input
            placeholder={t('select_model_then_add_vehicle_form.nickname')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder={t('select_model_then_add_vehicle_form.plate')}
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
          />
          <Input
            type="number"
            placeholder={t('select_model_then_add_vehicle_form.year')}
            value={year || ''}
            onChange={(e) => setYear(parseInt(e.target.value) || undefined)}
          />
          <Input
            type="number"
            placeholder={t('select_model_then_add_vehicle_form.odo')}
            value={odo || ''}
            onChange={(e) => setOdo(parseInt(e.target.value) || undefined)}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              id="primary"
            />
            <label htmlFor="primary">{t('select_model_then_add_vehicle_form.set_primary')}</label>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={!name || !selectedModel || loading}>
              {loading
                ? t('select_model_then_add_vehicle_form.saving')
                : `💾 ${t('select_model_then_add_vehicle_form.save')}`}
            </Button>
            <Button variant="ghost" onClick={() => setSelectedModel(null)}>
              ← {t('select_model_then_add_vehicle_form.change_model')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
