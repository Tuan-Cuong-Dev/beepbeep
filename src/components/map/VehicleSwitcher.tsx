// Các nút lựa chọn xe trên map (absolute trong vùng map → không đè popup/panel)
'use client';

import React from 'react';
import clsx from 'clsx';

type VehicleType = 'car' | 'motorbike' | 'bike';

interface VehicleSwitcherProps {
  vehicleType: VehicleType;
  onChange: (type: VehicleType) => void;
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;
  position?: 'absolute' | 'fixed';
  top?: number;
  right?: number;
}

export default function VehicleSwitcher({
  vehicleType,
  onChange,
  className,
  style,
  zIndex = 10,               // rất thấp; panel/popup bên ngoài luôn thắng
  position = 'absolute',     // ⬅️ thay vì fixed
  top = 96,                  // ~ top-24
  right = 16,                // ~ right-4
}: VehicleSwitcherProps) {
  const btnBase =
    'w-12 h-12 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d289]';

  const Btn = ({ type, label, emoji }: { type: VehicleType; label: string; emoji: string }) => (
    <button
      type="button"
      onClick={() => onChange(type)}
      aria-label={label}
      aria-pressed={vehicleType === type}
      className={clsx(btnBase, vehicleType === type ? 'bg-[#00d289] text-white' : 'bg-gray-100 hover:bg-gray-200')}
    >
      <span role="img" aria-hidden>{emoji}</span>
    </button>
  );

  return (
    <div
      className={clsx('pointer-events-auto', className)}
      style={{ position, top, right, zIndex, ...style }}
    >
      <div className="bg-white rounded-full shadow-lg p-1 flex flex-col items-center gap-2">
        <Btn type="car" label="Car" emoji="🚗" />
        <Btn type="motorbike" label="Motorbike" emoji="🛵" />
        <Btn type="bike" label="Bike" emoji="🚲" />
      </div>
    </div>
  );
}
