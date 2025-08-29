// Các nút lựa chọn xe trên map (đã hạ z-index để không đè modal/toast)
'use client';

import React from 'react';
import clsx from 'clsx';

type VehicleType = 'car' | 'motorbike' | 'bike';

interface VehicleSwitcherProps {
  vehicleType: VehicleType;
  onChange: (type: VehicleType) => void;

  /** Vị trí & lớp ngoài; cho phép override nếu cần */
  className?: string;
  style?: React.CSSProperties;
  /** z-index mặc định 900 (thấp hơn modal/toast), có thể truyền vào để tinh chỉnh */
  zIndex?: number;
  /** fixed cho UI nổi; có thể đổi sang 'absolute' nếu muốn phụ thuộc parent */
  position?: 'fixed' | 'absolute';
  /** offset tiện dụng (px) */
  top?: number;
  right?: number;
}

export default function VehicleSwitcher({
  vehicleType,
  onChange,
  className,
  style,
  zIndex = 900,               // ⬅️ thấp hơn modal/toast
  position = 'fixed',
  top = 96,                   // ≈ top-24
  right = 16,                 // ≈ right-4
}: VehicleSwitcherProps) {
  const WrapperTag = 'div';

  const btnBase =
    'w-12 h-12 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d289]';

  const Btn = ({
    type,
    label,
    emoji,
  }: {
    type: VehicleType;
    label: string;
    emoji: string;
  }) => (
    <button
      type="button"
      onClick={() => onChange(type)}
      aria-label={label}
      aria-pressed={vehicleType === type}
      className={clsx(
        btnBase,
        vehicleType === type ? 'bg-[#00d289] text-white' : 'bg-gray-100 hover:bg-gray-200'
      )}
    >
      <span role="img" aria-hidden>
        {emoji}
      </span>
    </button>
  );

  return (
    <WrapperTag
      className={clsx(
        'bb-vehicle-switcher', // ⬅️ có thể ép z-index bằng CSS global nếu cần
        'pointer-events-auto',
        className
      )}
      style={{
        position,
        top,
        right,
        zIndex,               // ⬅️ khóa thứ tự lớp tại đây
        ...style,
      }}
    >
      <div className="bg-white rounded-full shadow-lg p-1 flex flex-col items-center gap-2">
        <Btn type="car" label="Car" emoji="🚗" />
        <Btn type="motorbike" label="Motorbike" emoji="🛵" />
        <Btn type="bike" label="Bike" emoji="🚲" />
      </div>
    </WrapperTag>
  );
}
