'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import TechnicianSuggestionList from './TechnicianSuggestionList';
import TechnicianSuggestionForm from './TechnicianSuggestionForm';

import type { ErrorCode, TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';

interface Props {
  onSaved?: () => void;
  existing?: ErrorCode | null;
}

export default function ErrorCodeForm({ onSaved, existing }: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'error_code_form_new' });
  const { user, role } = useUser();

  const isTechnician = role === 'technician';
  const isTechnicianPartner = role === 'technician_partner';
  const isReadonlyRole = isTechnician || isTechnicianPartner;

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('');
  const [technicianSuggestions, setTechnicianSuggestions] = useState<TechnicianSuggestion[]>([]);
  const [technicianReferences, setTechnicianReferences] = useState<{ name?: string; phone?: string }[]>([]);
  const [supportTechnicians, setSupportTechnicians] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    description: '',
  });

  const requiredMissing = useMemo(() => {
    return !code.trim() || !description.trim() || !recommendedSolution.trim();
  }, [code, description, recommendedSolution]);

  useEffect(() => {
    if (!existing) {
      setCode('');
      setDescription('');
      setRecommendedSolution('');
      setBrand('');
      setModelName('');
      setTutorialVideoUrl('');
      setTechnicianSuggestions([]);
      setTechnicianReferences([]);
      return;
    }

    setCode(existing.code || '');
    setDescription(existing.description || '');
    setRecommendedSolution(existing.recommendedSolution || '');
    setBrand(existing.brand || '');
    setModelName(existing.modelName || '');
    setTutorialVideoUrl(existing.tutorialVideoUrl || '');
    setTechnicianSuggestions(existing.technicianSuggestions || []);
    setTechnicianReferences(existing.technicianReferences || []);
  }, [existing]);

  const handleAddSuggestion = (comment: string) => {
    if (!user?.uid || !comment.trim()) return;
    const suggestion: TechnicianSuggestion = {
      userId: user.uid,
      name: (user as any).name || user.email || 'Unknown',
      comment: comment.trim(),
      timestamp: Timestamp.now(),
    };
    setTechnicianSuggestions((prev) => [...prev, suggestion]);
  };

  const normalizeYouTube = (url: string) => url.trim();

  const updateReference = (index: number, field: 'name' | 'phone', value: string) => {
    setTechnicianReferences((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const addReference = () => setTechnicianReferences((prev) => [...prev, { name: '', phone: '' }]);
  const removeReference = (index: number) => setTechnicianReferences((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (isReadonlyRole || !user?.uid || requiredMissing) return;

    setLoading(true);
    try {
      const payload = {
        code: code.trim(),
        description: description.trim(),
        recommendedSolution: recommendedSolution.trim(),
        brand: brand.trim(),
        modelName: modelName.trim(),
        tutorialVideoUrl: tutorialVideoUrl ? normalizeYouTube(tutorialVideoUrl) : '',
        technicianSuggestions,
        technicianReferences: technicianReferences.map((r) => ({
          name: r.name?.trim() || undefined,
          phone: r.phone?.trim() || undefined,
        })),
        supportTechnicians,
        updatedAt: Timestamp.now(),
      } as Partial<ErrorCode> & { updatedAt: Timestamp };

      if (existing?.id) {
        await updateDoc(doc(db, 'errorCodes', existing.id), payload);
        setNotification({
          open: true,
          type: 'success',
          title: t('updated_success_title'),
          description: t('updated_success_desc', { code: code.trim() }),
        });
      } else {
        await addDoc(collection(db, 'errorCodes'), {
          ...payload,
          createdBy: user.uid,
          createdAt: Timestamp.now(),
        });
        setNotification({
          open: true,
          type: 'success',
          title: t('saved_success_title'),
          description: t('saved_success_desc', { code: code.trim() }),
        });
        setCode('');
        setDescription('');
        setRecommendedSolution('');
        setBrand('');
        setModelName('');
        setTutorialVideoUrl('');
        setTechnicianSuggestions([]);
        setTechnicianReferences([]);
      }

      onSaved?.();
    } catch (e) {
      console.error('Error saving error code:', e);
      setNotification({
        open: true,
        type: 'error',
        title: t('save_failed_title'),
        description: t('save_failed_desc'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (isReadonlyRole) return null;

  return (
    <>
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-4 px-1 sm:px-0">
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">
            {existing ? t('title_edit') : t('title_add')}
          </h2>
          <div className="hidden md:block">
            <Button onClick={handleSubmit} disabled={loading || requiredMissing} loading={loading}>
              {existing ? t('btn_update') : t('btn_save')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-2 sm:p-5">
              <div className="grid grid-cols-1 gap-3">
                <Input placeholder={t('ph_code')} value={code} onChange={(e) => setCode(e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder={t('ph_brand')} value={brand} onChange={(e) => setBrand(e.target.value)} />
                  <Input placeholder={t('ph_model')} value={modelName} onChange={(e) => setModelName(e.target.value)} />
                </div>
                <Textarea rows={4} placeholder={t('ph_description')} value={description} onChange={(e) => setDescription(e.target.value)} />
                <Textarea rows={5} placeholder={t('ph_solution')} value={recommendedSolution} onChange={(e) => setRecommendedSolution(e.target.value)} />
                <Input placeholder={t('ph_video')} value={tutorialVideoUrl} onChange={(e) => setTutorialVideoUrl(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-2 sm:p-5">
              <h3 className="text-base font-semibold mb-2">{t('suggestions_heading')}</h3>
              <div className="space-y-3">
                <TechnicianSuggestionForm onSubmit={handleAddSuggestion} />
                <TechnicianSuggestionList suggestions={technicianSuggestions} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-2 sm:p-5">
              <h3 className="text-base font-semibold mb-3">{t('references_heading')}</h3>
              <div className="space-y-2">
                {technicianReferences.map((ref, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder={t('ph_ref_name')}
                      value={ref.name || ''}
                      onChange={(e) => updateReference(idx, 'name', e.target.value)}
                      className="w-1/2"
                    />
                    <Input
                      placeholder={t('ph_ref_phone')}
                      value={ref.phone || ''}
                      onChange={(e) => updateReference(idx, 'phone', e.target.value)}
                      className="w-1/2"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeReference(idx)} className="text-red-500">
                      ✕
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addReference} className="text-[#00d289]">
                  ➕ {t('add_reference')}
                </Button>
              </div>
            </div>

            <div className="md:hidden">
              <Button className="w-full" onClick={handleSubmit} disabled={loading || requiredMissing} loading={loading}>
                {existing ? t('btn_update') : t('btn_save')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <NotificationDialog
        open={notification.open}
        type={notification.type}
        title={notification.title}
        description={notification.description}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
      />
    </>
  );
}
