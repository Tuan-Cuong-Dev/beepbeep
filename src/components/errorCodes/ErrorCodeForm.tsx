'use client';

import { useEffect, useState } from 'react';
import { ErrorCode, TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useUser } from '@/src/context/AuthContext';
import TechnicianSuggestionList from './TechnicianSuggestionList';
import TechnicianSuggestionForm from './TechnicianSuggestionForm';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function ErrorCodeForm({
  onSaved,
  existing,
}: {
  onSaved?: () => void;
  existing?: ErrorCode | null;
}) {
  const { user, role } = useUser();
  const isTechnician = role === 'technician';
  const isTechnicianPartner = role === 'technician_partner';

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('');
  const [technicianSuggestions, setTechnicianSuggestions] = useState<TechnicianSuggestion[]>([]);
  const [supportTechnicians, setSupportTechnicians] = useState<string[]>([]);
  const [technicianReferences, setTechnicianReferences] = useState<{ name?: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    description?: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    description: '',
  });

  useEffect(() => {
    if (existing) {
      setCode(existing.code);
      setDescription(existing.description);
      setRecommendedSolution(existing.recommendedSolution);
      setBrand(existing.brand || '');
      setModelName(existing.modelName || '');
      setTutorialVideoUrl(existing.tutorialVideoUrl || '');
      setTechnicianSuggestions(existing.technicianSuggestions || []);
      setTechnicianReferences(existing.technicianReferences || []);
    } else {
      setCode('');
      setDescription('');
      setRecommendedSolution('');
      setBrand('');
      setModelName('');
      setTutorialVideoUrl('');
      setTechnicianSuggestions([]);
      setTechnicianReferences([]);
    }
  }, [existing]);

  const handleAddSuggestion = (comment: string) => {
    if (!user?.uid) return;
    const suggestion: TechnicianSuggestion = {
      userId: user.uid,
      name: user.displayName || 'Unknown',
      comment,
      timestamp: Timestamp.now(),
    };
    setTechnicianSuggestions((prev) => [...prev, suggestion]);
  };

  const handleSubmit = async () => {
    const isReadonlyRole = isTechnician || isTechnicianPartner;
    if (!code || !description || !recommendedSolution || !user?.uid || isReadonlyRole) return;

    setLoading(true);

    try {
      const data = {
        code,
        description,
        recommendedSolution,
        brand,
        modelName,
        tutorialVideoUrl,
        technicianSuggestions,
        supportTechnicians,
        technicianReferences,
        updatedAt: Timestamp.now(),
      };

      if (existing?.id) {
        const ref = doc(db, 'errorCodes', existing.id);
        await updateDoc(ref, data);
        setNotification({
          open: true,
          type: 'success',
          title: 'Updated Successfully',
          description: `Error code "${code}" has been updated.`,
        });
      } else {
        await addDoc(collection(db, 'errorCodes'), {
          ...data,
          createdBy: user.uid,
          createdAt: Timestamp.now(),
        });
        setNotification({
          open: true,
          type: 'success',
          title: 'Saved Successfully',
          description: `New error code "${code}" has been added.`,
        });

        // Reset form
        setCode('');
        setDescription('');
        setRecommendedSolution('');
        setBrand('');
        setModelName('');
        setTutorialVideoUrl('');
        setTechnicianSuggestions([]);
        setTechnicianReferences([]);
      }

      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error saving error code:', error);
      setNotification({
        open: true,
        type: 'error',
        title: 'Save Failed',
        description: 'An error occurred while saving the error code.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReference = (index: number, field: 'name' | 'phone', value: string) => {
    const updated = [...technicianReferences];
    updated[index][field] = value;
    setTechnicianReferences(updated);
  };

  const addReference = () => {
    setTechnicianReferences([...technicianReferences, { name: '', phone: '' }]);
  };

  const removeReference = (index: number) => {
    const updated = [...technicianReferences];
    updated.splice(index, 1);
    setTechnicianReferences(updated);
  };

  if (isTechnician || isTechnicianPartner) return null;

  return (
    <>
      <div className="space-y-4 w-full sm:max-w-xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
          {existing ? '✏️ Edit Error Code' : '➕ Add New Error Code'}
        </h2>

        <Input placeholder="Error Code (e.g. E01)" value={code} onChange={(e) => setCode(e.target.value)} />
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea
          placeholder="Recommended Solution"
          value={recommendedSolution}
          onChange={(e) => setRecommendedSolution(e.target.value)}
        />
        <Input placeholder="Brand (e.g. Selex)" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <Input placeholder="Model Name (e.g. Camel 2)" value={modelName} onChange={(e) => setModelName(e.target.value)} />
        <Input
          placeholder="Tutorial Video URL (YouTube)"
          value={tutorialVideoUrl}
          onChange={(e) => setTutorialVideoUrl(e.target.value)}
        />

        <div className="space-y-2">
          <h3 className="font-semibold">💡 Technician Suggestions</h3>
          <TechnicianSuggestionForm onSubmit={handleAddSuggestion} />
          <TechnicianSuggestionList suggestions={technicianSuggestions} />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">🔧 Technician References</h3>
          {technicianReferences.map((ref, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Name"
                value={ref.name || ''}
                onChange={(e) => updateReference(idx, 'name', e.target.value)}
                className="w-1/2"
              />
              <Input
                placeholder="Phone"
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
            ➕ Add Reference
          </Button>
        </div>

        <div className="pt-2">
          <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : existing ? 'Update Code' : 'Save Error Code'}
          </Button>
        </div>
      </div>

      <NotificationDialog
        open={notification.open}
        type={notification.type}
        title={notification.title}
        description={notification.description}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
