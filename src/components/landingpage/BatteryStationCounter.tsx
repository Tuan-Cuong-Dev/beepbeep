'use client';

import useBatteryStationStats from '@/src/hooks/useBatteryStationStats';
import Image from 'next/image';
import Link from 'next/link';

export default function BatteryStationCounter() {
  const count = useBatteryStationStats();

  return (
    <Link href="/battery-stations" className="block group">
      <section className="relative w-full h-[320px] md:h-[400px] bg-black text-white cursor-pointer">
        <Image
          src="https://drive.google.com/uc?export=view&id=1bWWB0g2g45g188O29MPn2KFMIFv73j9v"
          alt="Battery Station Background"
          layout="fill"
          objectFit="cover"
          className="opacity-80"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4 text-center transition-transform group-hover:scale-105">
          <p className="text-5xl md:text-6xl font-bold tracking-tight">
            {count !== null ? count.toLocaleString() : '...'}
          </p>
          <p className="text-xl md:text-2xl mt-2">Battery Swap Stations</p>
          <p className="text-sm md:text-base mt-1 text-gray-200">
            Click to explore stations across the country
          </p>
        </div>
      </section>
    </Link>
  );
}
