// components/ebikes/PrintQRModal.tsx

"use client";

import { useRef } from "react";
import { Ebike } from '@/src/lib/vehicles/ebikeTypes';
import { EbikeModel } from '@/src/lib/vehicle-models/vehicleModelTypes';

interface Props {
  open: boolean;
  onClose: () => void;
  ebikes: Ebike[];
  models: EbikeModel[];
}

export default function PrintQRModal({ open, onClose, ebikes, models }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (printContents) {
      const printWindow = window.open("", "", "width=800,height=1000");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Labels</title>
              <style>
                @media print {
                  @page { size: auto; margin: 0; }
                  body { margin: 0; padding: 0; }
                }
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 4mm;
                  box-sizing: border-box;
                  display: flex;
                  flex-wrap: wrap;
                  gap: 6mm;
                  justify-content: flex-start;
                }
                .label {
                  page-break-inside: avoid;
                  width: 60mm;
                  height: 70mm;
                  border: 1px solid #333;
                  border-radius: 8px;
                  padding: 4mm;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: flex-start;
                  text-align: center;
                }
                .label img {
                  width: 36mm;
                  height: 36mm;
                }
                .info {
                  margin-top: 2.5mm;
                  font-size: 10pt;
                  line-height: 1.4;
                }
              </style>
            </head>
            <body>
              ${printContents}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        // Ensure images are loaded before printing
        setTimeout(() => {
          const images = printWindow.document.images;
          let loadedCount = 0;
          const checkAndPrint = () => {
            if (loadedCount === images.length) {
              printWindow.print();
              printWindow.close();
            }
          };
          if (images.length === 0) checkAndPrint();
          for (let img of images) {
            if (img.complete) {
              loadedCount++;
              checkAndPrint();
            } else {
              img.onload = () => {
                loadedCount++;
                checkAndPrint();
              };
              img.onerror = () => {
                loadedCount++;
                checkAndPrint();
              };
            }
          }
        }, 300);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded max-w-[90vw] max-h-[90vh] overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <h2 className="text-lg font-bold">Print All QR Labels</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              Print All
            </button>
            <button
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>

        <div ref={printRef} className="flex flex-wrap gap-4 p-4 border-t mt-4">
          {ebikes.map((bike) => {
            const modelName = models.find((m) => m.id === bike.modelId)?.name || "Model";
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              bike.vehicleID || bike.id || ""
            )}`;
            return (
              <div key={bike.id} className="label">
                <img src={qrImageUrl} alt="QR Code" />
                <div className="info"><strong>{modelName}</strong></div>
                <div className="info">Plate: {bike.plateNumber || "N/A"}</div>
                <div className="info">ID: {bike.vehicleID || bike.id}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
