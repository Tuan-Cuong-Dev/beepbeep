'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Image from 'next/image';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';

export default function ServicesPage() {
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const router = useRouter();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'servicePricings'));
        const data = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
            } as ServicePricing;
          })
          .filter((service) => service.isActive === true); // ✅ Chỉ lấy dịch vụ đang hoạt động

        setServices(data);
      } catch (error) {
        console.error('Error fetching service pricings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // ✅ Lấy danh sách category, thay undefined bằng 'Uncategorized'
  const categories = [
    'All',
    ...Array.from(
      new Set(
        services.map((s) => s.category ?? 'Uncategorized')
      )
    ),
  ];

  // ✅ Lọc dịch vụ theo category
  const filteredServices =
    activeCategory === 'All'
      ? services
      : services.filter(
          (s) => (s.category ?? 'Uncategorized') === activeCategory
        );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-gray-800">
          🛠️ Explore Our Services
        </h1>

        {/* Tabs by Category */}
        <div className="flex justify-center mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex flex-wrap gap-2 bg-white rounded-full p-2 shadow">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-sm sm:text-base px-4 py-1 rounded-full border border-gray-300 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Services Grid */}
        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading services...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="bg-white h-[180px] w-full relative flex items-center justify-center p-4">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      width={300}
                      height={180}
                      className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4 pt-2">
                  <h3 className="font-semibold text-gray-800 text-base mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>

                  <ul className="text-xs text-gray-500 list-disc pl-5 mt-2 mb-3">
                    {service.features?.slice(0, 4).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center text-sm font-semibold text-[#00d289]">
                    <span>{formatCurrency(service.price)} VND</span>
                    {service.durationEstimate && (
                      <span className="text-gray-400">⏱️ {service.durationEstimate}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
