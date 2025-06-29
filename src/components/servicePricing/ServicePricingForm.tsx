'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';
import { SimpleSelect } from '@/src/components/ui/select';

interface Props {
  existing?: ServicePricing | null;
  onSaved?: () => void;
  onRefresh?: () => void;
}

const categories = ['Repair', 'Maintenance', 'Cleaning', 'Parts Replacement', 'Insurance'];

export default function ServicePricingForm({ existing, onSaved, onRefresh }: Props) {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [durationEstimate, setDurationEstimate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setFeaturesText(existing.features?.join('\n') || '');
      setPrice(existing.price.toString());
      setCategory(existing.category || '');
      setDurationEstimate(existing.durationEstimate || '');
      setImageUrl(existing.imageUrl || '');
      setIsActive(existing.isActive ?? true);
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
      category,
      durationEstimate,
      imageUrl,
      isActive,
      updatedAt: Timestamp.now(),
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
    setCategory('');
    setDurationEstimate('');
    setImageUrl('');
    setIsActive(true);
    setLoading(false);
    if (onSaved) onSaved();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">
        {existing ? 'Edit Service Package' : 'Add Service Package'}
      </h2>
      <Input
        placeholder="Service title (e.g. Basic Maintenance)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Brief description of the service package, its purpose, and customer benefits."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Textarea
        placeholder="Work steps or service items, one per line.\nE.g.:\n- Check electrical system\n- Apply brake oil"
        value={featuresText}
        onChange={(e) => setFeaturesText(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Service price (VND)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <div className="space-y-1">
        <label className="text-sm font-medium">Category</label>
        <SimpleSelect
          placeholder="Select category"
          value={category}
          onChange={(val) => setCategory(val)}
          options={categories.map((cat) => ({ label: cat, value: cat }))}
        />
      </div>

      <Input
        placeholder="Estimated time (e.g. 30 mins, 1 hour)"
        value={durationEstimate}
        onChange={(e) => setDurationEstimate(e.target.value)}
      />
      <Input
        placeholder="Image URL (optional)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <label className="text-sm">Show service</label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
      </div>
      <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
        {loading ? 'Saving...' : existing ? 'Update Package' : 'Add Package'}
      </Button>
    </div>
  );
}
