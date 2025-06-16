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
    <div className="space-y-4 w-full sm:max-w-xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
        {existing ? '✏️ Edit Error Code' : '➕ Add New Error Code'}
      </h2>

      <Input
        className="w-full"
        placeholder="Error Code (e.g. E01)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Textarea
        className="w-full"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Textarea
        className="w-full"
        placeholder="Recommended Solution"
        value={recommendedSolution}
        onChange={(e) => setRecommendedSolution(e.target.value)}
      />
      <Input
        className="w-full"
        placeholder="Brand (e.g. Selex)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      />
      <Input
        className="w-full"
        placeholder="Model Name (e.g. Camel 2)"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
      />

      <div className="pt-2">
        <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : existing ? 'Update Code' : 'Save Error Code'}
        </Button>
      </div>
    </div>
  );
}
