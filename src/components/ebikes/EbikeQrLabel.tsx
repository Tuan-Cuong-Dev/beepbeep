//  Component EbikeQrLabel.tsx  
// bạn có thể dùng để hiển thị 1 tem QR chuẩn (có QR code, model name, biển số, ID).

// components/ebikes/EbikeQrLabel.tsx

"use client";

import QRCode from "react-qr-code";
import { Ebike } from "@/src/lib/ebikes/ebikeTypes";

interface Props {
  ebike: Ebike;
  modelName?: string;
  size?: number; // pixel
}

export default function EbikeQrLabel({ ebike, modelName = "", size = 128 }: Props) {
  return (
    <div
      className="border border-gray-400 rounded p-2 flex flex-col items-center justify-center"
      style={{ width: size + 32, height: size + 80 }}
    >
      <QRCode
        value={ebike.vehicleID || ebike.id || "unknown"}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: `${size}px` }}
      />
      <div className="mt-2 text-center text-sm">
        <div className="font-semibold">{modelName}</div>
        <div className="text-xs">Biển số: {ebike.plateNumber || "N/A"}</div>
        <div className="text-xs">ID: {ebike.vehicleID || ebike.id}</div>
      </div>
    </div>
  );
}
