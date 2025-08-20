'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';

import type { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';

interface Props {
  existing?: ServicePricing | null;
  onSaved?: () => void;
  onRefresh?: () => void;
}

const rawCategories = ['Repair', 'Maintenance', 'Cleaning', 'Parts Replacement', 'Insurance'] as const;

type Category = typeof rawCategories[number];

export default function ServicePricingForm({ existing, onSaved, onRefresh }: Props) {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [durationEstimate, setDurationEstimate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const requiredMissing = useMemo(() => {
    return !title.trim() || !description.trim() || !price.trim();
  }, [title, description, price]);

  useEffect(() => {
    if (!existing) {
      setTitle('');
      setDescription('');
      setFeaturesText('');
      setPrice('');
      setCategory('');
      setDurationEstimate('');
      setImageUrl('');
      setIsActive(true);
      return;
    }
    setTitle(existing.title || '');
    setDescription(existing.description || '');
    setFeaturesText(existing.features?.join('\n') || '');
    setPrice(existing.price != null ? String(existing.price) : '');
    setCategory((existing.category as Category) || '');
    setDurationEstimate(existing.durationEstimate || '');
    setImageUrl(existing.imageUrl || '');
    setIsActive(existing.isActive ?? true);
  }, [existing]);

  const parseFeatures = (text: string) =>
    text
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!user?.uid || requiredMissing) return;
    setLoading(true);
    try {
      const features = parseFeatures(featuresText);
      const numericPrice = Number(price.replace(/[,\s]/g, ''));

      const data = {
        title: title.trim(),
        description: description.trim(),
        features,
        price: Number.isFinite(numericPrice) ? numericPrice : 0,
        currency: 'VND' as const,
        category: (category || '') as string,
        durationEstimate: durationEstimate.trim(),
        imageUrl: imageUrl.trim(),
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

      // reset after save (new or update) to keep UX consistent with your previous form
      setTitle('');
      setDescription('');
      setFeaturesText('');
      setPrice('');
      setCategory('');
      setDurationEstimate('');
      setImageUrl('');
      setIsActive(true);

      onSaved?.();
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-6">
      {/* Header + primary action */}
      <div className="mb-4 flex items-start justify-between gap-4 px-1 sm:px-0">
        <h2 className="text-lg sm:text-2xl font-semibold">
          {existing ? t('service_pricing_form.edit_title') : t('service_pricing_form.add_title')}
        </h2>
        <div className="hidden md:block">
          <Button onClick={handleSave} disabled={loading || requiredMissing} loading={loading}>
            {existing ? t('service_pricing_form.update_button') : t('service_pricing_form.add_button')}
          </Button>
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* LEFT: core fields */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-2 sm:p-5">
            <div className="grid grid-cols-1 gap-3">
              <Input
                placeholder={t('service_pricing_form.title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder={t('service_pricing_form.price_placeholder')}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <div className="space-y-1">
                  <SimpleSelect
                    placeholder={t('service_pricing_form.category_placeholder')}
                    value={category}
                    onChange={(val) => setCategory(val as Category)}
                    options={rawCategories.map((cat) => ({
                      label: t(`service_pricing_form.categories.${cat}`),
                      value: cat,
                    }))}
                  />
                </div>
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
            </div>
          </div>
        </div>

        {/* RIGHT: descriptions and toggles */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-2 sm:p-5">
            <Textarea
              rows={4}
              placeholder={t('service_pricing_form.description_placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl shadow p-2 sm:p-5">
            <Textarea
              rows={6}
              placeholder={t('service_pricing_form.features_placeholder')}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl shadow p-2 sm:p-5 flex items-center justify-between">
            <label className="text-sm">{t('service_pricing_form.active_label')}</label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          {/* Mobile action */}
          <div className="md:hidden">
            <Button className="w-full" onClick={handleSave} disabled={loading || requiredMissing} loading={loading}>
              {existing ? t('service_pricing_form.update_button') : t('service_pricing_form.add_button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
