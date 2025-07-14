// CreateInsuranceProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import Image from 'next/image';
import { InsuranceProduct } from '@/src/lib/insuranceProducts/insuranceProductTypes';
import NotificationDialog, { NotificationType } from '@/src/components/ui/NotificationDialog';

function getDirectDriveImageUrl(driveUrl: string): string {
  const idMatch = driveUrl.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
  return idMatch ? `https://drive.google.com/uc?export=view&id=${idMatch[1]}` : '';
}

export default function CreateInsuranceProductForm({
  initialProduct,
  onSaveComplete,
}: {
  initialProduct?: InsuranceProduct | null;
  onSaveComplete?: () => void;
}) {
  const { create, update } = useInsuranceProducts();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverageDetails, setCoverageDetails] = useState('');
  const [features, setFeatures] = useState('');
  const [durationInDays, setDurationInDays] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<NotificationType>('success');

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setDescription(initialProduct.description || '');
      setCoverageDetails(initialProduct.coverageDetails || '');
      setFeatures(initialProduct.features?.join('\n') || '');
      setDurationInDays(initialProduct.durationInDays?.toString() || '');
      setPrice(initialProduct.price?.toString() || '');
      setImageUrl(initialProduct.imageUrl || '');
      setIsActive(initialProduct.isActive ?? true);
    } else {
      setName('');
      setDescription('');
      setCoverageDetails('');
      setFeatures('');
      setDurationInDays('');
      setPrice('');
      setImageUrl('');
      setIsActive(true);
    }
  }, [initialProduct]);

  const directImageUrl = getDirectDriveImageUrl(imageUrl);

  const handleSubmit = async () => {
    if (!name || !price || !durationInDays || !coverageDetails) return;

    const data = {
      name: name.trim(),
      description: description.trim(),
      coverageDetails: coverageDetails.trim(),
      features: features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f !== ''),
      durationInDays: parseInt(durationInDays),
      price: parseFloat(price),
      isActive,
      imageUrl: directImageUrl || undefined,
    };

    try {
      setLoading(true);
      if (initialProduct?.id) {
        await update(initialProduct.id, data);
        setDialogMessage('Insurance product updated successfully!');
      } else {
        await create(data);
        setDialogMessage('Insurance product created successfully!');
      }

      setDialogType('success');
      setDialogOpen(true);
      if (onSaveComplete) onSaveComplete();
    } catch (error) {
      const message = typeof error === 'string' ? error : error instanceof Error ? error.message : '';
      const linkWarning = imageUrl.includes('drive.google.com') && !imageUrl.includes('/d/')
        ? '\n👉 Google Drive image link seems incorrect. Please use the format: https://drive.google.com/file/d/FILE_ID/view'
        : '';

      setDialogMessage(`Failed to save insurance product.${linkWarning}`);
      setDialogType('error');
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hidden md:block border p-6 mb-6 rounded-xl bg-white space-y-4 max-w-xl mx-auto shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {initialProduct ? '✏️ Edit Insurance Product' : '➕ Create New Insurance Product'}
        </h2>

        <div className="space-y-2">
          <Input placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Textarea placeholder="Coverage Details" value={coverageDetails} onChange={(e) => setCoverageDetails(e.target.value)} />
          <Textarea placeholder="Features (one per line)" value={features} onChange={(e) => setFeatures(e.target.value)} />
          <Input type="number" placeholder="Duration (days)" value={durationInDays} onChange={(e) => setDurationInDays(e.target.value)} min="1" />
          <Input type="number" placeholder="Price (VND)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" />

          <div>
            <Input
              type="text"
              placeholder="Google Drive Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-xs text-gray-400 pt-1">
              Example: https://drive.google.com/file/d/FILE_ID/view
            </p>
          </div>

          {directImageUrl && (
            <div className="mt-2">
              <Image
                src={directImageUrl}
                alt="Preview"
                width={400}
                height={200}
                className="rounded-md border"
              />
            </div>
          )}

          <label className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={isActive} onChange={() => setIsActive((prev) => !prev)} />
            <span className="text-sm text-gray-600">Active</span>
          </label>
        </div>

        <div className="pt-2 text-right">
          <Button
            onClick={handleSubmit}
            disabled={loading || !name || !price || !coverageDetails || !durationInDays}
          >
            {loading
              ? initialProduct
                ? 'Updating...'
                : 'Creating...'
              : initialProduct
              ? 'Update Product'
              : 'Create Product'}
          </Button>
        </div>
      </div>

      <NotificationDialog
        open={dialogOpen}
        type={dialogType}
        title={dialogType === 'success' ? 'Success' : 'Error'}
        description={dialogMessage}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}