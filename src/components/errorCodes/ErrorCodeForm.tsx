'use client';

import { useEffect, useState } from 'react';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  onSaved?: () => void;
  existing?: ErrorCode | null;
}

export default function ErrorCodeForm({ onSaved, existing }: Props) {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setCode(existing.code);
      setDescription(existing.description);
      setRecommendedSolution(existing.recommendedSolution);
      setBrand(existing.brand || '');
      setModelName(existing.modelName || '');
    } else {
      setCode('');
      setDescription('');
      setRecommendedSolution('');
      setBrand('');
      setModelName('');
    }
  }, [existing]);

  const handleSubmit = async () => {
    if (!code || !description || !recommendedSolution || !user?.uid) return;
    setLoading(true);

    try {
      if (existing?.id) {
        const ref = doc(db, 'errorCodes', existing.id);
        await updateDoc(ref, {
          code,
          description,
          recommendedSolution,
          brand,
          modelName,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'errorCodes'), {
          code,
          description,
          recommendedSolution,
          brand,
          modelName,
          createdBy: user.uid,
          createdAt: Timestamp.now(),
        });
      }

      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error saving code:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">
        {existing ? '✏️ Edit Error Code' : '➕ Add New Error Code'}
      </h2>
      <Input placeholder="Error Code (e.g. E01)" value={code} onChange={(e) => setCode(e.target.value)} />
      <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Textarea placeholder="Recommended Solution" value={recommendedSolution} onChange={(e) => setRecommendedSolution(e.target.value)} />
      <Input placeholder="Brand (e.g. Selex)" value={brand} onChange={(e) => setBrand(e.target.value)} />
      <Input placeholder="Model Name (e.g. Camel 2)" value={modelName} onChange={(e) => setModelName(e.target.value)} />
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : existing ? 'Update Code' : 'Save Error Code'}
      </Button>
    </div>
  );
}
