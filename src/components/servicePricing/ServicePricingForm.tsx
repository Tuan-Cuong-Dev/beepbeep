'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';

interface Props {
  existing?: ServicePricing | null;
  onSaved?: () => void;
}

export default function ServicePricingForm({ existing, onSaved }: Props) {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setFeaturesText(existing.features?.join('\n') || '');
      setPrice(existing.price.toString());
    }
  }, [existing]);

  const handleSave = async () => {
    if (!title || !description || !price || !user?.uid) return;
    setLoading(true);

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f);

    const data = {
      title,
      description,
      features,
      price: parseFloat(price),
      currency: 'VND' as const,
    };

    if (existing?.id) {
      await updateDoc(doc(db, 'servicePricings', existing.id), data);
    } else {
      await addDoc(collection(db, 'servicePricings'), {
        ...data,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });
    }

    setTitle('');
    setDescription('');
    setFeaturesText('');
    setPrice('');
    setLoading(false);
    if (onSaved) onSaved();
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">
        {existing ? 'Edit Service Package' : 'Add Service Package'}
      </h2>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Textarea
        placeholder="Features (one per line)"
        value={featuresText}
        onChange={(e) => setFeaturesText(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Price (VND)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : existing ? 'Update Package' : 'Save Package'}
      </Button>
    </div>
  );
}