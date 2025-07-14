'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInsuranceProductById } from '@/src/hooks/useInsuranceProducts';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Image from 'next/image';
import { getDirectDriveImageUrl } from '@/src/utils/getDirectDriveImageUrl';
import { Button } from '@/src/components/ui/button';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { useEffect, useState } from 'react';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUserPersonalVehicles } from '@/src/hooks/useUserPersonalVehicles';
import { useAuth } from '@/src/hooks/useAuth';

export default function InsuranceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { product, loading } = useInsuranceProductById(id as string);
  const { create } = useInsurancePackages();
  const { vehicles, loading: loadingVehicles } = useUserPersonalVehicles();
  const { currentUser } = useAuth();

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [frameNumber, setFrameNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  if (loading || loadingVehicles) return <p className="p-4 text-gray-500">Loading...</p>;
  if (!product) return <p className="p-4 text-red-500">Insurance product not found.</p>;

  const motorbikes = vehicles.filter(v => v.vehicleType === 'motorbike');
  const imageUrl = getDirectDriveImageUrl(product.imageUrl || '');

  const handleBuyNow = async () => {
    if (!selectedVehicleId || !frameNumber || !engineNumber) {
      alert('Please fill in all required fields (vehicle, frame number, engine number)');
      return;
    }

    try {
      await create({
        userId: currentUser?.uid || '',
        productId: product.id,
        vehicleId: selectedVehicleId,
        frameNumber,
        engineNumber,
        plateNumber,
        imageUrl: product.imageUrl,
        note: 'Bought via Bíp Bíp Web – pending approval',
      });
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/profile'); // chuyển về profile hoặc /my-insurances
      }, 1500);
    } catch (err) {
      console.error('❌ Failed to buy insurance:', err);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto p-6 space-y-6 bg-white rounded shadow mt-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-green-700">{product.name}</h1>
          <p className="text-gray-600 text-sm">{product.description}</p>
        </div>

        {product.imageUrl && (
          <div className="w-full h-[240px] relative rounded border overflow-hidden">
            <Image src={imageUrl} alt="Insurance" fill className="object-contain" />
          </div>
        )}

        <div className="space-y-1">
          <h2 className="font-semibold text-gray-800">Coverage Details</h2>
          <p className="text-gray-700 text-sm">{product.coverageDetails}</p>
        </div>

        {product.features?.length > 0 && (
          <div className="space-y-1">
            <h2 className="font-semibold text-gray-800">Included Features</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {product.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-4 text-sm text-gray-600 space-y-1">
          <p><strong>Duration:</strong> {product.durationInDays} days</p>
          <p><strong>Price:</strong> {product.price.toLocaleString()}₫</p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={product.isActive ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
          <p><strong>Created:</strong> {safeFormatDate(product.createdAt?.toDate?.() || product.createdAt)}</p>
        </div>

        {product.isActive && (
      <>
        {/* 🔔 Warning for user to add personal vehicle first */}
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-300 rounded p-3">
          💡 Please purchase insurance for your <strong>personal motorbike</strong>. Make sure you’ve added your vehicle in{' '}
          <a href="/profile/my-vehicles" className="underline font-medium text-green-700">
            My Vehicles
          </a>{' '}
          before proceeding.
        </p>

        {/* 🚲 Select and fill vehicle info */}
        <div className="pt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Select your vehicle to apply insurance:
          </label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
          >
            <option value="">-- Select a motorbike --</option>
            {motorbikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.name} – {bike.licensePlate || 'No Plate'} – {bike.frameNumber || 'No Frame'}
              </option>
            ))}
          </select>

          {/* Frame Number */}
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Frame Number *"
            value={frameNumber}
            onChange={(e) => setFrameNumber(e.target.value)}
            required
          />

          {/* Engine Number */}
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Engine Number *"
            value={engineNumber}
            onChange={(e) => setEngineNumber(e.target.value)}
            required
          />

          {/* Plate Number (Optional) */}
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Plate Number (optional)"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />

          <Button className="w-full mt-2" onClick={handleBuyNow}>
            🛒 Buy This Insurance
          </Button>
        </div>
      </>
        )}

      </main>

      <Footer />

      <NotificationDialog
        open={showSuccess}
        type="success"
        title="Success"
        description="Your insurance request has been sent. Please wait for admin approval!"
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}
