'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Image from 'next/image';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { ArrowLeft, ShoppingCart, Bike, ChevronRight } from 'lucide-react';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function VehicleModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = Array.isArray(params?.id) ? params.id[0] : params?.id;

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
          .filter((doc) => doc.id !== modelId)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
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
          <button onClick={() => router.push('/vehicle-models')} className="hover:underline">Vehicle Models</button>
          <ChevronRight size={16} />
          <span className="font-semibold text-gray-800">{model.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 md:flex min-h-[440px]">
          <div className="relative w-full md:w-1/2 h-[440px]">
            <Image
              src={model.imageUrl || '/no-image.png'}
              alt={model.name}
              fill
              className="object-contain p-6 rounded-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

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
                <div>{model.available ? <span className="text-green-600 font-medium">Available</span> : <span className="text-red-500 font-medium">Unavailable</span>}</div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg space-y-2 text-gray-800 text-sm mt-6">
                {model.pricePerHour && <div><span className="bg-pink-100 px-2 py-1 rounded">⏱️ Hourly:</span> {formatCurrency(model.pricePerHour)}</div>}
                <div><span className="bg-yellow-200 px-2 py-1 rounded text-sm font-medium">💰 Daily:</span> {formatCurrency(model.pricePerDay)}</div>
                {model.pricePerWeek && <div><span className="bg-blue-100 px-2 py-1 rounded">📅 Weekly:</span> {formatCurrency(model.pricePerWeek)}</div>}
                {model.pricePerMonth && <div><span className="bg-purple-100 px-2 py-1 rounded">🗓️ Monthly:</span> {formatCurrency(model.pricePerMonth)}</div>}
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
                    <Image
                      src={item.imageUrl || '/no-image.png'}
                      alt={item.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-semibold text-gray-700 text-base">{item.name}</h3>
                    <p className="text-sm text-[#00d289] font-medium">{formatCurrency(item.pricePerDay)} / day</p>
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
