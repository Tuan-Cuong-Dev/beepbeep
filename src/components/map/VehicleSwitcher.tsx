'use client';

import React from 'react';

interface VehicleSwitcherProps {
  vehicleType: 'car' | 'motorbike' | 'bike';
  onChange: (type: 'car' | 'motorbike' | 'bike') => void;
}

export default function VehicleSwitcher({ vehicleType, onChange }: VehicleSwitcherProps) {
  return (
    <div className="absolute top-24 right-4 z-50">
      <div className="bg-white rounded-full shadow-lg p-1 flex flex-col items-center gap-2">
        <button
          onClick={() => onChange('car')}
          className={`w-12 h-12 flex items-center justify-center rounded-full ${
            vehicleType === 'car' ? 'bg-[#00d289] text-white' : 'bg-gray-100'
          }`}
          aria-label="Car"
        >
          🚗
        </button>
        <button
          onClick={() => onChange('motorbike')}
          className={`w-12 h-12 flex items-center justify-center rounded-full ${
            vehicleType === 'motorbike' ? 'bg-[#00d289] text-white' : 'bg-gray-100'
          }`}
          aria-label="Motorbike"
        >
          🛵
        </button>
        <button
          onClick={() => onChange('bike')}
          className={`w-12 h-12 flex items-center justify-center rounded-full ${
            vehicleType === 'bike' ? 'bg-[#00d289] text-white' : 'bg-gray-100'
          }`}
          aria-label="Bike"
        >
          🚲
        </button>
      </div>
    </div>
  );
}
