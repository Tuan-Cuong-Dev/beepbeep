'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { ErrorCode, TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';
import { Timestamp } from 'firebase/firestore';
import TechnicianSuggestionForm from './TechnicianSuggestionForm';
import TechnicianSuggestionList from './TechnicianSuggestionList';

export default function TechnicianSuggestErrorCode() {
  const { user, role } = useUser();
  const isTechnician = role === 'technician'|| role === 'technician_partner';

  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

    useEffect(() => {
    if (!isTechnician) return;

    const fetchErrorCodes = async () => {
        try {
        const snap = await getDocs(collection(db, 'errorCodes'));
        const list: ErrorCode[] = snap.docs.map((doc) => ({
            ...(doc.data() as ErrorCode),
            id: doc.id, // ✅ gán id sau để tránh ghi đè
        }));
        setErrorCodes(list);
        } catch (error) {
        console.error('Failed to fetch error codes:', error);
        }
    };

    fetchErrorCodes();
    }, [isTechnician]);


  const handleSubmit = async (comment: string) => {
    if (!user || !selectedId) return;

    const suggestion: TechnicianSuggestion = {
      userId: user.uid,
      name: user.displayName || 'Unknown',
      comment,
      timestamp: Timestamp.now(),
    };

    const code = errorCodes.find((e) => e.id === selectedId);
    if (!code) return;

    const updatedSuggestions = [...(code.technicianSuggestions || []), suggestion];

    setLoading(true);
    try {
      await updateDoc(doc(db, 'errorCodes', selectedId), {
        technicianSuggestions: updatedSuggestions,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCode = errorCodes.find((e) => e.id === selectedId);

  if (!isTechnician) return <p className="text-center text-red-500 py-10">🚫 Technician only.</p>;

  return (
    <div className="space-y-4 bg-white p-6 rounded-xl shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800">💬 Suggest Solution for an Error Code</h2>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      >
        <option value="">-- Select an Error Code --</option>
        {errorCodes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.code} – {e.description}
          </option>
        ))}
      </select>

      {selectedCode && (
        <div className="space-y-4">
          <div className="p-4 border rounded bg-gray-50">
            <p><strong>Description:</strong> {selectedCode.description}</p>
            <p><strong>Recommended:</strong> {selectedCode.recommendedSolution}</p>
          </div>

          <TechnicianSuggestionForm onSubmit={handleSubmit} />
          <TechnicianSuggestionList suggestions={selectedCode.technicianSuggestions || []} />

          {success && <p className="text-green-600 text-sm">✅ Suggestion added successfully!</p>}
        </div>
      )}
    </div>
  );
}
