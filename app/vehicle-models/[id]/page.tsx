'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Image, { type StaticImageData } from 'next/image';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { ArrowLeft, ShoppingCart, Bike, ChevronRight } from 'lucide-react';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

/* ====== Image helpers & fallbacks ====== */
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

const TYPE_ALIAS: Record<string, keyof typeof DEFAULT_ICONS> = {
  bicycle: 'bike',
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
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = m1?.[1] || m2?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
};

const getTypeKey = (vt?: string): keyof typeof DEFAULT_ICONS | undefined => {
  if (!vt) return undefined;
  const norm = vt.toLowerCase();
  return TYPE_ALIAS[norm] || (norm as keyof typeof DEFAULT_ICONS);
};

const resolveModelImage = (m: any): string | StaticImageData => {
  const direct = toDirectDriveUrl(m?.imageUrl);
  if (direct) return direct;
  const k = getTypeKey(m?.vehicleType);
  return (k && DEFAULT_ICONS[k]) || PLACEHOLDER_SVG;
};

/** Ảnh thông minh: ưu tiên ảnh model (Drive -> direct), onError fallback theo vehicleType */
function SmartImage(props: {
  model: any;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const { model, alt, className, fill, width, height, sizes, priority } = props;
  const initial = useMemo(() => resolveModelImage(model), [model]);
  const [src, setSrc] = useState<string | StaticImageData>(initial);

  const fallback = useMemo(() => {
    const k = getTypeKey(model?.vehicleType);
    return (k && DEFAULT_ICONS[k]) || PLACEHOLDER_SVG;
  }, [model?.vehicleType]);

  const common = {
    alt,
    className,
    sizes,
    priority,
    onError: () => setSrc(fallback),
  } as const;

  return fill ? (
    <Image {...common} src={src} fill />
  ) : (
    <Image {...common} src={src} width={width || 320} height={height || 180} />
  );
}

export default function VehicleModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedModels, setRelatedModels] = useState<any[]>([]);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const fetchModel = async () => {
      if (!modelId) return;
      try {
        const docSnap = await getDoc(doc(db, 'vehicleModels', modelId));
        if (docSnap.exists()) setModel({ id: docSnap.id, ...docSnap.data() });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, [modelId]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!model?.companyId || !modelId) return;
      try {
        const snapshot = await getDocs(
          query(collection(db, 'vehicleModels'), where('companyId', '==', model.companyId))
        );
        const filtered = snapshot.docs
          .filter((d) => d.id !== modelId)
          .map((d) => ({ id: d.id, ...d.data() }));
        setRelatedModels(filtered);
      } catch (error) {
        console.error('Error fetching related models:', error);
      }
    };
    if (model) fetchRelated();
  }, [model, modelId]);

  if (loading) return <div className="text-center py-20 text-gray-500 animate-pulse">Loading...</div>;
  if (!model) return <div className="text-center py-20 text-red-500">Vehicle model not found.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <button onClick={() => router.push('/')} className="flex items-center gap-1 hover:underline">
            <Bike size={16} /> Home
          </button>
          <ChevronRight size={16} />
          <button onClick={() => router.push('/vehicle-models')} className="hover:underline">
            Vehicle Models
          </button>
          <ChevronRight size={16} />
          <span className="font-semibold text-gray-800">{model.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 md:flex min-h-[440px]">
          {/* Ảnh chính */}
          <div className="relative w-full md:w-1/2 h-[440px]">
            <SmartImage
              model={model}
              alt={model.name}
              fill
              className="object-contain p-6 rounded-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Thông tin */}
          <div className="p-8 md:w-1/2 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-600">{model.name}</h1>
              <p className="text-gray-600 leading-relaxed">{model.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-800 mt-6">
                <div>🔋 <strong>Battery:</strong></div><div>{model.batteryCapacity}</div>
                <div>⚙️ <strong>Motor Power:</strong></div><div>{model.motorPower} W</div>
                <div>⚡ <strong>Top Speed:</strong></div><div>{model.topSpeed} km/h</div>
                <div>📏 <strong>Range:</strong></div><div>{model.range} km</div>
                <div>🏋️ <strong>Max Load:</strong></div><div>{model.maxLoad ?? 'N/A'} kg</div>
                <div>⚖️ <strong>Weight:</strong></div><div>{model.weight} kg</div>
                <div>📦 <strong>Status:</strong></div>
                <div>
                  {model.available ? (
                    <span className="text-green-600 font-medium">Available</span>
                  ) : (
                    <span className="text-red-500 font-medium">Unavailable</span>
                  )}
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg space-y-2 text-gray-800 text-sm mt-6">
                {model.pricePerHour && (
                  <div>
                    <span className="bg-pink-100 px-2 py-1 rounded">⏱️ Hourly:</span>{' '}
                    {formatCurrency(model.pricePerHour)}
                  </div>
                )}
                <div>
                  <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-medium">💰 Daily:</span>{' '}
                  {formatCurrency(model.pricePerDay)}
                </div>
                {model.pricePerWeek && (
                  <div>
                    <span className="bg-blue-100 px-2 py-1 rounded">📅 Weekly:</span>{' '}
                    {formatCurrency(model.pricePerWeek)}
                  </div>
                )}
                {model.pricePerMonth && (
                  <div>
                    <span className="bg-purple-100 px-2 py-1 rounded">🗓️ Monthly:</span>{' '}
                    {formatCurrency(model.pricePerMonth)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <button
                onClick={() => router.back()}
                className="text-gray-500 flex items-center gap-1 hover:underline"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => setShowNotice(true)}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-600 transition"
              >
                <ShoppingCart size={18} /> Rent this vehicle
              </button>
            </div>
          </div>
        </div>

        <NotificationDialog
          open={showNotice}
          onClose={() => setShowNotice(false)}
          type="info"
          title="🚧 Rent Coming Soon"
          description="We are currently preparing this rental feature. Please check back later or contact support."
        />

        {/* Gợi ý */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">You Might Also Like</h2>
          {relatedModels.length === 0 ? (
            <p className="text-gray-500 text-sm">No other models available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedModels.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/vehicle-models/${item.id}`)}
                >
                  <div className="relative w-full aspect-[4/3] rounded-t-xl overflow-hidden">
                    <SmartImage
                      model={item}
                      alt={item.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-semibold text-gray-700 text-base line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-[#00d289] font-medium">
                      {formatCurrency(item.pricePerDay)} / day
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                      {item.motorPower !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-500">⚙️</span>
                          <span>{item.motorPower} W</span>
                        </div>
                      )}
                      {item.topSpeed !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-orange-500">⚡</span>
                          <span>{item.topSpeed} km/h</span>
                        </div>
                      )}
                      {item.range !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500">📏</span>
                          <span>{item.range} km</span>
                        </div>
                      )}
                      {item.maxLoad !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600">🏋️</span>
                          <span>{item.maxLoad} kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
