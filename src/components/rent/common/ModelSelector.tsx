'use client';
// Xữ lý việc chọn models xe
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface ModelSelectorProps {
  companyId: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ModelSelector({ companyId, value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      const snapshot = await getDocs(
        query(collection(db, 'ebikeModels'), where('companyId', '==', companyId), where('available', '==', true))
      );
      const availableModels = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setModels(availableModels);
    };

    fetchModels();
  }, [companyId]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border px-3 py-2 rounded"
    >
      <option value="">-- Select Model --</option>
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
}
