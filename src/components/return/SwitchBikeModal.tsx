'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Input } from '@/src/components/ui/input';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useCompanyAndStation } from '@/src/hooks/useCompanyAndStation';
import { Ebike } from '@/src/lib/vehicles/vehicleTypes'; // ✅ Sử dụng type gốc

interface SwitchBikeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedBike: Ebike) => void;
}

export default function SwitchBikeModal({ open, onClose, onConfirm }: SwitchBikeModalProps) {
  const [selectedBike, setSelectedBike] = useState<Ebike | null>(null);
  const [availableBikes, setAvailableBikes] = useState<Ebike[]>([]);
  const [search, setSearch] = useState('');
  const { companyId, stationId } = useCompanyAndStation();

  useEffect(() => {
    const fetchBikes = async () => {
      if (!companyId || !stationId) return;

      const q = query(
        collection(db, 'ebikes'),
        where('companyId', '==', companyId),
        where('stationId', '==', stationId),
        where('status', '==', 'Available')
      );
      const snap = await getDocs(q);

      const list: Ebike[] = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Ebike))
        .sort((a, b) => a.vehicleID.localeCompare(b.vehicleID));

      setAvailableBikes(list);
    };

    if (open) fetchBikes();
  }, [open, companyId, stationId]);

  const handleConfirm = () => {
    if (!selectedBike) return;
    onConfirm(selectedBike);
    onClose();
  };

  const filteredBikes = availableBikes.filter(
    (bike) =>
      bike.vehicleID.toLowerCase().includes(search.toLowerCase()) ||
      bike.plateNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Switch to Another Vehicle</DialogTitle>
        </DialogHeader>

        <div className="mb-2">
          <Input
            placeholder="Search by VIN or Plate Number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-60 space-y-4 pr-2 mt-2">
          {filteredBikes.map((bike) => (
            <div
              key={bike.id}
              className={`border p-4 rounded-xl cursor-pointer transition-all ${
                selectedBike?.id === bike.id ? 'border-[#00d289] bg-[#e6fff6]' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedBike(bike)}
            >
              <div className="font-semibold text-sm">
                {bike.vehicleID} - {bike.plateNumber || 'No Plate'}
              </div>
              <div className="text-xs text-gray-600">
                📏 {bike.odo.toLocaleString()} km | 📝 {bike.note || '—'}
              </div>
            </div>
          ))}
        </ScrollArea>

        <div className="flex justify-end mt-6 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBike}
            className="bg-[#00d289] hover:bg-[#00b67a] text-white"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
