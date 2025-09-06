'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Image, { type StaticImageData } from 'next/image';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import {
  VehicleModel,
  VEHICLE_TYPE_LABELS,
} from '@/src/lib/vehicle-models/vehicleModelTypes';

/* ---------- Image helpers & fallbacks ---------- */
import bicycleIcon from '@/public/assets/images/vehicles/bicycle.png';
import motorbikeIcon from '@/public/assets/images/vehicles/motorbike.png';
import carIcon from '@/public/assets/images/vehicles/car.png';
import vanIcon from '@/public/assets/images/vehicles/van.png';
import busIcon from '@/public/assets/images/vehicles/bus.png';

const DEFAULT_ICONS: Record<string, StaticImageData> = {
  bike: bicycleIcon,
  motorbike: motorbikeIcon,
  car: carIcon,
  van: vanIcon,
  bus: busIcon,
};

const PLACEHOLDER_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="none">
  <rect width="320" height="180" fill="#F6F7F9"/>
  <rect x="20" y="50" width="280" height="80" rx="10" stroke="#CBD5E1" stroke-width="2" fill="none"/>
  <circle cx="90" cy="130" r="9" fill="#CBD5E1"/>
  <circle cx="230" cy="130" r="9" fill="#CBD5E1"/>
</svg>
`);

const toDirectDriveUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  // match /d/<id>/... or ?id=<id>
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = m1?.[1] || m2?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
};

const resolveModelImage = (model: VehicleModel): string | StaticImageData => {
  const direct = toDirectDriveUrl(model.imageUrl);
  if (direct) return direct;
  const vt = (model.vehicleType || '').toLowerCase();
  const key = vt === 'bicycle' ? 'bike' : vt;
  return DEFAULT_ICONS[key] ?? PLACEHOLDER_SVG;
};

/* ---------- Card (tách state fallback ảnh theo từng item) ---------- */
function ModelCard({ model, onClick }: { model: VehicleModel; onClick: () => void }) {
  const initialSrc = useMemo(() => resolveModelImage(model), [model]);
  const [imgSrc, setImgSrc] = useState<string | StaticImageData>(initialSrc);

  return (
    <div
      className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      <div className="bg-white h-[180px] w-full relative flex items-center justify-center p-4">
        <Image
          src={imgSrc}
          alt={model.name || 'Vehicle'}
          width={320}
          height={180}
          className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
          onError={() => {
            // Nếu ảnh lỗi → rơi về icon theo loại, cuối cùng là placeholder
            const vt = (model.vehicleType || '').toLowerCase();
            const key = vt === 'bicycle' ? 'bike' : vt;
            setImgSrc(DEFAULT_ICONS[key] ?? PLACEHOLDER_SVG);
          }}
        />
      </div>

      <div className="px-4 pb-4 pt-2">
        <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-1">
          {model.name}
        </h3>
        <p className="text-sm text-[#00d289] font-semibold mb-2">
          {formatCurrency(model.pricePerDay ?? 0)} / day
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {model.motorPower && (
            <div className="flex items-center gap-1">⚙️ {model.motorPower}W</div>
          )}
          {model.topSpeed && (
            <div className="flex items-center gap-1">⚡ {model.topSpeed} km/h</div>
          )}
          {model.range && (
            <div className="flex items-center gap-1">📏 {model.range} km</div>
          )}
          {model.maxLoad && (
            <div className="flex items-center gap-1">🏋️ {model.maxLoad} kg</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function VehicleModelsPage() {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'vehicleModels'));
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            companyId: d.companyId || '',
            name: d.name || '',
            description: d.description || '',
            vehicleType: d.vehicleType || 'other',
            vehicleSubType: d.vehicleSubType,
            brand: d.brand,
            modelCode: d.modelCode,
            batteryCapacity: d.batteryCapacity,
            motorPower: d.motorPower,
            fuelType: d.fuelType,
            topSpeed: d.topSpeed,
            range: d.range,
            weight: d.weight,
            maxLoad: d.maxLoad,
            capacity: d.capacity,
            pricePerDay: d.pricePerDay,
            pricePerHour: d.pricePerHour,
            pricePerWeek: d.pricePerWeek,
            pricePerMonth: d.pricePerMonth,
            imageUrl: d.imageUrl,
            available: d.available ?? true,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          } as VehicleModel;
        });
        setModels(data);
      } catch (error) {
        console.error('Error fetching vehicle models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const filteredModels =
    activeType === 'all'
      ? models
      : models.filter((model) => model.vehicleType === activeType);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-gray-800">
          🛵 Choose Your Vehicle
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar bg-white rounded-full p-2 shadow min-w-full max-w-full">
              <TabsTrigger
                value="all"
                className="text-sm sm:text-base px-4 py-1 rounded-full border border-gray-300 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
              >
                All
              </TabsTrigger>
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-sm sm:text-base px-4 py-1 rounded-full border border-gray-300 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onClick={() => router.push(`/vehicle-models/${model.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
