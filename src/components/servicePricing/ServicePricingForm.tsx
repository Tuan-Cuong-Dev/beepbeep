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
import { useTranslation } from 'react-i18next';

interface Props {
  existing?: ServicePricing | null;
  onSaved?: () => void;
  onRefresh?: () => void;
}

const rawCategories = ['Repair', 'Maintenance', 'Cleaning', 'Parts Replacement', 'Insurance'];

export default function ServicePricingForm({ existing, onSaved, onRefresh }: Props) {
  const { t } = useTranslation('common');
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

    // Reset form
    setTitle('');
    setDescription('');
    setFeaturesText('');
    setPrice('');
    setCategory('');
    setDurationEstimate('');
    setImageUrl('');
    setIsActive(true);
    setLoading(false);

    onSaved?.();
    onRefresh?.();
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">
        {existing ? t('service_pricing_form.edit_title') : t('service_pricing_form.add_title')}
      </h2>

      <Input
        placeholder={t('service_pricing_form.title_placeholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        placeholder={t('service_pricing_form.description_placeholder')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Textarea
        placeholder={t('service_pricing_form.features_placeholder')}
        value={featuresText}
        onChange={(e) => setFeaturesText(e.target.value)}
      />

      <Input
        type="number"
        placeholder={t('service_pricing_form.price_placeholder')}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium">{t('service_pricing_form.category_label')}</label>
        <SimpleSelect
          placeholder={t('service_pricing_form.category_placeholder')}
          value={category}
          onChange={(val) => setCategory(val)}
          options={rawCategories.map((cat) => ({
            label: t(`service_pricing_form.categories.${cat}`),
            value: cat,
          }))}
        />
      </div>

      <Input
        placeholder={t('service_pricing_form.duration_placeholder')}
        value={durationEstimate}
        onChange={(e) => setDurationEstimate(e.target.value)}
      />

      <Input
        placeholder={t('service_pricing_form.image_placeholder')}
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <label className="text-sm">{t('service_pricing_form.active_label')}</label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
        {loading
          ? t('service_pricing_form.saving')
          : existing
          ? t('service_pricing_form.update_button')
          : t('service_pricing_form.add_button')}
      </Button>
    </div>
  );
}
