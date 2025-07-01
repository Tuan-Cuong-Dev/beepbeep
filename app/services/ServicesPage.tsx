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
        <div className="w-full overflow-x-auto px-4 mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex gap-2 bg-white rounded-full p-2 shadow overflow-x-auto whitespace-nowrap no-scrollbar min-w-max">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-sm sm:text-base px-4 py-1 rounded-full border border-gray-300 data-[state=active]:bg-[#00d289] data-[state=active]:text-white whitespace-nowrap"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* Image Section */}
                <div className="relative w-full h-[220px] overflow-hidden">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      fill
                      className="object-contain p-6 transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between flex-grow p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>

                    <ul className="text-xs text-gray-500 list-disc pl-4 mt-2 space-y-1">
                      {service.features?.slice(0, 4).map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex justify-between items-center mt-4 text-sm font-medium">
                    <span className="text-[#00d289]">{formatCurrency(service.price)} VND</span>
                    {service.durationEstimate && (
                      <span className="text-gray-400">⏱ {service.durationEstimate}</span>
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
