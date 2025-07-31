'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext';
import { collection, doc, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { ErrorCode, TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';
import TechnicianSuggestionForm from './TechnicianSuggestionForm';
import TechnicianSuggestionList from './TechnicianSuggestionList';
import { Input } from '@/src/components/ui/input';

export default function TechnicianSuggestErrorCode() {
  const { t } = useTranslation('common');
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
      name: user.name || 'Unknown',
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
    return <p className="text-center text-red-500 py-10">🚫 {t('technician_suggest_error_code.only_technician')}</p>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Danh sách mã lỗi */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder={t('technician_suggest_error_code.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="border rounded px-3 py-2 min-w-[160px]"
            >
              <option value="all">{t('technician_suggest_error_code.all_brands')}</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="h-[400px] overflow-y-auto border rounded-md bg-gray-50">
            {filteredCodes.length > 0 ? (
              filteredCodes.map((code) => (
                <div
                  key={code.id}
                  className={`p-3 border-b cursor-pointer hover:bg-green-100 ${
                    selectedId === code.id ? 'bg-green-200 font-semibold' : ''
                  }`}
                  onClick={() => setSelectedId(code.id)}
                >
                  <p className="truncate">{code.code} — {code.description}</p>
                  <p className="text-xs text-gray-500 italic">
                    {t('technician_suggest_error_code.brand')}: {code.brand}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm p-3">{t('technician_suggest_error_code.no_results')}</p>
            )}
          </div>
        </div>

        {/* Chi tiết và gợi ý */}
        <div className="space-y-4">
          {selectedCode ? (
            <>
              <div className="p-4 border rounded-lg bg-gray-50 space-y-2 text-sm">
                <div>
                  <span className="font-medium">{t('technician_suggest_error_code.code')}:</span> {selectedCode.code}
                </div>
                <div>
                  <span className="font-medium">{t('technician_suggest_error_code.description')}:</span> {selectedCode.description}
                </div>
                <div>
                  <span className="font-medium">{t('technician_suggest_error_code.recommended')}:</span> {selectedCode.recommendedSolution}
                </div>
                <div>
                  <span className="font-medium">{t('technician_suggest_error_code.brand')}:</span> {selectedCode.brand}
                </div>
              </div>

              <TechnicianSuggestionForm onSubmit={handleSubmit} loading={loading} />
              <TechnicianSuggestionList suggestions={selectedCode.technicianSuggestions || []} />

              {success && <p className="text-green-600 text-sm">✅ {t('technician_suggest_error_code.success_message')}</p>}
            </>
          ) : (
            <p className="text-gray-500 italic">{t('technician_suggest_error_code.select_prompt')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
