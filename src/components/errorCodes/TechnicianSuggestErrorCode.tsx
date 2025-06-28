'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { ErrorCode, TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';
import { Timestamp } from 'firebase/firestore';
import TechnicianSuggestionForm from './TechnicianSuggestionForm';
import TechnicianSuggestionList from './TechnicianSuggestionList';
import { Input } from '@/src/components/ui/input';

export default function TechnicianSuggestErrorCode() {
  const { user, role } = useUser();
  const isTechnician = role === 'technician' || role === 'technician_partner';

  const [errorCodes, setErrorCodes] = useState<ErrorCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
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
          id: doc.id,
        }));
        setErrorCodes(list);
      } catch (error) {
        console.error('Failed to fetch error codes:', error);
      }
    };

    fetchErrorCodes();
  }, [isTechnician]);

  const brandOptions = Array.from(new Set(errorCodes.map((e) => e.brand || 'Unknown'))).sort();

  const filteredCodes = errorCodes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'all' || code.brand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  const selectedCode = errorCodes.find((e) => e.id === selectedId);

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

  if (!isTechnician) {
    return <p className="text-center text-red-500 py-10">🚫 Technician only.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🛠 Suggest a Solution for Error Code</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Filter + List */}
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              type="text"
              placeholder="🔍 Search code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Brands</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-auto border rounded-md p-2 bg-gray-50">
            {filteredCodes.length > 0 ? (
              filteredCodes.map((code) => (
                <div
                  key={code.id}
                  className={`p-3 rounded cursor-pointer hover:bg-green-100 ${
                    selectedId === code.id ? 'bg-green-200 font-semibold' : ''
                  }`}
                  onClick={() => setSelectedId(code.id)}
                >
                  <p>{code.code} — {code.description}</p>
                  <p className="text-sm text-gray-500 italic">Brand: {code.brand}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No matching codes found.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Detail + Form */}
        <div className="space-y-4">
          {selectedCode ? (
            <>
              <div className="p-4 border rounded bg-gray-50">
                <p><strong>Code:</strong> {selectedCode.code}</p>
                <p><strong>Description:</strong> {selectedCode.description}</p>
                <p><strong>Recommended:</strong> {selectedCode.recommendedSolution}</p>
                <p><strong>Brand:</strong> {selectedCode.brand}</p>
              </div>

              <TechnicianSuggestionForm onSubmit={handleSubmit} loading={loading} />
              <TechnicianSuggestionList suggestions={selectedCode.technicianSuggestions || []} />

              {success && <p className="text-green-600 text-sm">✅ Suggestion added successfully!</p>}
            </>
          ) : (
            <p className="text-gray-500 italic">Please select an error code to suggest a solution.</p>
          )}
        </div>
      </div>
    </div>
  );
}
