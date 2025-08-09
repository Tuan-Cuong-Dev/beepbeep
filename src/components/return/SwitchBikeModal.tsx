'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Input } from '@/src/components/ui/input';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/vehicles/ebikeTypes';

interface SwitchBikeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedBike: Ebike) => void;
  companyId: string;
}

export default function SwitchBikeModal({
  open,
  onClose,
  onConfirm,
  companyId,
}: SwitchBikeModalProps) {
  const { t } = useTranslation('common');
  const [selectedBike, setSelectedBike] = useState<Ebike | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Ebike[]>([]);

  useEffect(() => {
    // Reset khi mở lại modal
    if (open) {
      setSearchTerm('');
      setSelectedBike(null);
    }
  }, [open]);

  useEffect(() => {
    const fetchAvailableBikes = async () => {
      console.log('🔍 Fetching bikes for companyId:', companyId, '| searchTerm:', searchTerm);

      if (!companyId) {
        console.warn('⛔ Skip fetch: Missing companyId');
        setOptions([]);
        return;
      }

      try {
        const q = query(
          collection(db, 'ebikes'),
          where('status', '==', 'Available'),
          where('companyId', '==', companyId)
        );

        const snap = await getDocs(q);
        const allBikes: Ebike[] = [];

        snap.forEach((doc) => {
          const bike = doc.data() as Ebike;

          const matchesSearch =
            !searchTerm ||
            bike.vehicleID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bike.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase());

          if (matchesSearch) {
            allBikes.push({ ...bike, id: doc.id });
          }
        });

        console.log(`✅ Found ${allBikes.length} bikes`);
        setOptions(allBikes.sort((a, b) => a.vehicleID.localeCompare(b.vehicleID)));
      } catch (error) {
        console.error('❌ Error fetching bikes:', error);
        setOptions([]);
      }
    };

    fetchAvailableBikes();
  }, [searchTerm, companyId]);

  const handleConfirm = () => {
    if (!selectedBike) return;
    onConfirm(selectedBike);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('switch_bike_modal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-2">
          <Input
            placeholder={t('switch_bike_modal.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-60 space-y-3 pr-2 mt-2">
          {options.map((bike) => (
            <div
              key={bike.id}
              className={`border p-4 rounded-xl cursor-pointer transition-all ${
                selectedBike?.id === bike.id ? 'border-[#00d289] bg-[#e6fff6]' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedBike(bike)}
            >
              <div className="font-semibold text-sm">
                {bike.vehicleID} – {bike.plateNumber || t('switch_bike_modal.no_plate')}
              </div>
              <div className="text-xs text-gray-600">
                📏 {bike.odo?.toLocaleString() || '0'} km • ⚡ {bike.batteryCapacity || '—'}Ah • 🎨{' '}
                {bike.color || '—'}
              </div>
              {bike.note && (
                <div className="text-xs text-gray-500 italic mt-1">📝 {bike.note}</div>
              )}
            </div>
          ))}
        </ScrollArea>

        {selectedBike && (
          <div className="mt-4 p-3 border rounded-md bg-gray-50 text-sm space-y-1">
            <div>
              ✅ <strong>{selectedBike.vehicleID}</strong> –{' '}
              {selectedBike.plateNumber || t('switch_bike_modal.no_plate')}
            </div>
            <div>
              📏 {selectedBike.odo?.toLocaleString()} km • ⚡ {selectedBike.batteryCapacity}Ah • 🎨{' '}
              {selectedBike.color || '—'}
            </div>
            {selectedBike.note && <div>📝 {selectedBike.note}</div>}
          </div>
        )}

        <div className="flex justify-end mt-6 gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('switch_bike_modal.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBike}
            className="bg-[#00d289] hover:bg-[#00b67a] text-white"
          >
            {t('switch_bike_modal.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
