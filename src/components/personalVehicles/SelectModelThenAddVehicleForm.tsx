'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { VehicleModel } from '@/src/lib/vehicleModels/vehicleModelTypes_new';
import { useAuth } from '@/src/hooks/useAuth';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import { addPersonalVehicleWithModel } from '@/src/hooks/useAddPersonalVehicle';

interface Props {
  onSaved: () => void;
}

  // 🔧 Convert Google Drive link to direct image URL
  const getDirectImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    const id = match?.[1];
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
  };


export default function SelectModelThenAddVehicleForm({ onSaved }: Props) {
  const { currentUser } = useAuth();

  const [models, setModels] = useState<VehicleModel[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);

  const [name, setName] = useState('');
  const [year, setYear] = useState<number | undefined>();
  const [odo, setOdo] = useState<number | undefined>();
  const [licensePlate, setLicensePlate] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      const snap = await getDocs(collection(db, 'vehicleModels'));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VehicleModel[];
      setModels(list);
    };
    fetchModels();
  }, []);

  const filteredModels = models.filter((m) =>
    `${m.brand} ${m.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!currentUser || !selectedModel || !name) return;

    setLoading(true);
    try {
      await addPersonalVehicleWithModel({
        userId: currentUser.uid,
        modelId: selectedModel.id,
        name,
        vehicleType: selectedModel.vehicleType,
        brand: selectedModel.brand ?? '',
        model: selectedModel.name,
        licensePlate,
        yearOfManufacture: year,
        odo,
        isPrimary,
      });
      onSaved();
    } catch (err) {
      console.error('❌ Failed to save vehicle:', err);
      alert('❌ Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded bg-white space-y-6">
      {!selectedModel ? (
        <>
          <h2 className="text-lg font-semibold">🔍 Search for your vehicle model</h2>
          <Input
            placeholder="e.g. VinFast Feliz, Yamaha Sirius..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredModels.map((model) => {
              return (
                <div
                  key={model.id}
                  className="border p-3 rounded hover:bg-gray-50 cursor-pointer flex gap-2 items-center"
                  onClick={() => setSelectedModel(model)}
                >
                  {model.imageUrl ? (
                    <Image
                        src={getDirectImageUrl(model.imageUrl) as string} // ✅ ép kiểu an toàn
                          alt={model.name}
                          width={60}
                          height={40}
                          className="rounded object-cover"
                        />
                      ) : (
                    <span className="text-gray-400 italic">No image</span>
                    )}
                  <div>
                    <div className="font-medium">
                      {model.brand} {model.name}
                    </div>
                    <div className="text-xs text-gray-500">{model.vehicleType}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">🚗 Add your vehicle</h2>
          <div className="bg-gray-100 p-3 rounded">
            <strong>Selected:</strong> {selectedModel.brand} {selectedModel.name} ({selectedModel.vehicleType})
          </div>

          <Input
            placeholder="Nickname (e.g. Xe của bố)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="License Plate (optional)"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Year of Manufacture"
            value={year || ''}
            onChange={(e) => setYear(parseInt(e.target.value) || undefined)}
          />
          <Input
            type="number"
            placeholder="Odo (km)"
            value={odo || ''}
            onChange={(e) => setOdo(parseInt(e.target.value) || undefined)}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              id="primary"
            />
            <label htmlFor="primary">Set as primary vehicle</label>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={!name || !selectedModel || loading}>
              {loading ? 'Saving...' : '💾 Save Vehicle'}
            </Button>
            <Button variant="ghost" onClick={() => setSelectedModel(null)}>
              ← Change model
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
