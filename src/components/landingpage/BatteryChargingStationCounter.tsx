'use client';

import { useEffect, useState } from 'react';
import useBatteryChargingStationStats from '@/src/hooks/useBatteryChargingStationStats';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function BatteryChargingStationCounter() {
  const { t } = useTranslation();
  const count = useBatteryChargingStationStats();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const formattedCount = typeof count === 'number' ? count.toLocaleString() : '...';
  const title = t('batteryChargingStationSection.count_label');
  const subtitle = t('batteryChargingStationSection.subtitle');

  return (
    <Link href="/battery-charging-stations" className="block group mt-6">
      <section
        aria-label="Battery Charging Station Counter Section"
        className="relative w-full h-[320px] md:h-[400px] bg-black text-white cursor-pointer"
      >
      <img
        src="/assets/images/batterychargingstations.jpg"
        alt="Battery Charging Station Background"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

        <div className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4 text-center transition-transform group-hover:scale-105">
          <p className="text-5xl md:text-6xl font-bold tracking-tight">{formattedCount}</p>
          <p className="text-xl md:text-2xl mt-2">{title}</p>
          <p className="text-sm md:text-base mt-1 text-gray-200">{subtitle}</p>
        </div>
      </section>
    </Link>
  );
}
