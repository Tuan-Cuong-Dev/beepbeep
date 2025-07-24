'use client';

import { useEffect, useState } from 'react';
import useBatteryChargingStationStats from '@/src/hooks/useBatteryChargingStationStats';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function BatteryChargingStationCounter() {
  const count = useBatteryChargingStationStats();
  const { t } = useTranslation();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <Link href="/battery-charging-stations" className="block group">
      <section className="relative w-full h-[320px] md:h-[400px] bg-black text-white cursor-pointer">
        <Image
          src="https://drive.google.com/uc?export=view&id=1jOwFQb-YOUR-IMAGE-ID" // 🔁 thay bằng hình nền trạm sạc
          alt="Battery Charging Station Background"
          fill
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4 text-center transition-transform group-hover:scale-105">
          <p className="text-5xl md:text-6xl font-bold tracking-tight">
            {count !== null ? count.toLocaleString() : '...'}
          </p>
          <p className="text-xl md:text-2xl mt-2">
            {t('batteryChargingStationSection.count_label')}
          </p>
          <p className="text-sm md:text-base mt-1 text-gray-200">
            {t('batteryChargingStationSection.subtitle')}
          </p>
        </div>
      </section>
    </Link>
  );
}
