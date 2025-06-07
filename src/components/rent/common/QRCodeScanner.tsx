'use client';
// Dùng để quét mã QR Code => Chưa cho chạy vì nó gọi đên Camera thật nên ko demo được
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import QrScanner from 'qr-scanner';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface QRCodeScannerProps {
  onScanned: (bikeInfo: any) => void;
}

export default function QRCodeScanner({ onScanned }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          if (result?.data) {
            const vehicleID = result.data.trim();
            const snapshot = await getDocs(collection(db, 'ebikes'));
            const bike = snapshot.docs
              .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
              .find(b => b.vehicleID?.toLowerCase() === vehicleID.toLowerCase());
            if (bike) {
              onScanned(bike);
            }
          }
        },
        { returnDetailedScanResult: true }
      );
      scanner.start();
      scannerRef.current = scanner;
      setScanning(true);

      return () => {
        scanner.stop();
        scanner.destroy();
        setScanning(false);
      };
    }
  }, []);

  return (
    <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg shadow">
      <div className="flex flex-col items-center">
        <Label className="text-center text-gray-700 font-medium text-lg mb-2">
          📷 Scan QR Code on the Bike
        </Label>
        <video
          ref={videoRef}
          className="w-full max-w-md h-auto border rounded-md"
          playsInline
          muted
          autoPlay
        />
        <p className="text-sm text-gray-500 mt-2">
          {scanning ? '🔍 Scanning in progress...' : 'Ready to scan'}
        </p>
      </div>
    </div>
  );
}
