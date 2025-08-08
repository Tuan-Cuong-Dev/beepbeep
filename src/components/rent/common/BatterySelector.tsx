'use client';

// Tác vụ chọn pin.
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { useTranslation } from 'react-i18next';

interface BatterySelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function BatterySelector({ value, onChange }: BatterySelectorProps) {
  const { t } = useTranslation('common');

  const [batteries, setBatteries] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatteries = async () => {
      try {
        const q = query(collection(db, 'batteries'), where('status', '==', 'in_stock'));
        const snap = await getDocs(q);
        const codes = snap.docs
          .map((doc) => doc.data()?.batteryCode as string)
          .filter(Boolean);

        setBatteries(codes);
      } catch (err) {
        console.error('❌ Error loading batteries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatteries();
  }, []);

  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      return;
    }

    const filtered = batteries.filter(code =>
      code.toLowerCase().includes(search.toLowerCase())
    );

    setSuggestions(filtered);
  }, [search, batteries]);

  return (
    <div className="relative space-y-2">
      <Input
        placeholder={
          loading
            ? t('battery_selector.loading')
            : t('battery_selector.placeholder')
        }
        value={search || value}
        onChange={(e) => setSearch(e.target.value)}
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded shadow-md mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((code) => (
            <li
              key={code}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                onChange(code);
                setSearch(code);
                setSuggestions([]);
              }}
            >
              {code}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
