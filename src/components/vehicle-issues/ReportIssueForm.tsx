'use client';

import { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useEbikeData } from '@/src/hooks/useEbikeData';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

interface ReportIssueFormProps {
  companyId: string;
  companyName: string;
  stationId: string;
  stationName: string;
  onReported?: () => void;
}

export default function ReportIssueForm({
  companyId,
  companyName,
  stationId,
  stationName,
  onReported,
}: ReportIssueFormProps) {
  const { t } = useTranslation('common');
  const { user, role } = useUser();
  const { ebikes } = useEbikeData({ companyId });

  const [selectedEbike, setSelectedEbike] = useState<{ id: string; vin: string; plateNumber?: string } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [ebikeDropdownOpen, setEbikeDropdownOpen] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const issueOptions = [
    { value: 'Flat Tire', label: t('report_issue_form.flat_tire') },
    { value: 'Battery Problem', label: t('report_issue_form.battery_problem') },
    { value: 'Brake Issue', label: t('report_issue_form.brake_issue') },
    { value: 'Motor Problem', label: t('report_issue_form.motor_problem') },
    { value: 'Other', label: t('report_issue_form.other_issue') },
  ];

  const filteredEbikes = useMemo(() => {
    return ebikes.filter((bike) => (bike.vehicleID || '').toLowerCase().includes(searchText.toLowerCase()));
  }, [searchText, ebikes]);

  const handleSubmit = async () => {
    const isGlobal = role === 'admin' || role === 'technician_assistant';

    if (!isGlobal && (!companyId || !companyName)) {
      alert('Company information missing.');
      return;
    }

    if (!selectedEbike) {
      alert(t('report_issue_form.select_vehicle_placeholder'));
      return;
    }

    if (!issueType) {
      alert(t('report_issue_form.select_issue_type_placeholder'));
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'vehicleIssues'), {
        companyId,
        companyName,
        stationId,
        stationName,
        ebikeId: selectedEbike.id,
        vin: selectedEbike.vin,
        plateNumber: selectedEbike.plateNumber || '',
        issueType,
        description,
        photos: [],
        status: 'pending',
        reportedBy: user?.name || user?.uid || 'unknown',
        reportedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setSelectedEbike(null);
      setIssueType('');
      setDescription('');
      onReported?.();
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert(t('report_issue_form.submit_failed'));
    }

    setSubmitting(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-6 md:space-y-0">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">{t('report_issue_form.select_vehicle_label')}</label>
          <div className="relative">
            <button
              className="w-full h-12 px-4 border rounded-lg bg-white text-left"
              onClick={() => setEbikeDropdownOpen(!ebikeDropdownOpen)}
            >
              {selectedEbike
                ? `🚲 ${selectedEbike.vin} (Plate: ${selectedEbike.plateNumber || '-'})`
                : t('report_issue_form.select_vehicle_placeholder')}
              <span className="float-right">▼</span>
            </button>
            {ebikeDropdownOpen && (
              <div className="absolute z-10 bg-white border rounded-lg shadow mt-2 w-full max-h-72 overflow-y-auto">
                <Input
                  className="m-2"
                  placeholder={t('report_issue_form.search_vehicle_placeholder')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {filteredEbikes.length === 0 && (
                  <div className="p-2 text-gray-500">{t('report_issue_form.no_vehicle_found')}</div>
                )}
                {filteredEbikes.map((ebike) => (
                  <div
                    key={ebike.id}
                    onClick={() => {
                      setSelectedEbike({ id: ebike.id, vin: ebike.vehicleID, plateNumber: ebike.plateNumber });
                      setEbikeDropdownOpen(false);
                    }}
                    className={cn(
                      'px-4 py-2 cursor-pointer hover:bg-gray-100',
                      selectedEbike?.id === ebike.id && 'bg-gray-100 font-semibold'
                    )}
                  >
                    🚲 {ebike.vehicleID}
                    <span className="text-xs text-gray-400 ml-2">
                      Plate: {ebike.plateNumber || '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">{t('report_issue_form.select_issue_type_label')}</label>
          <div className="relative">
            <button
              className="w-full h-12 px-4 border rounded-lg bg-white text-left"
              onClick={() => setIssueDropdownOpen(!issueDropdownOpen)}
            >
              {issueType || t('report_issue_form.select_issue_type_placeholder')}
              <span className="float-right">▼</span>
            </button>
            {issueDropdownOpen && (
              <div className="absolute z-10 bg-white border rounded-lg shadow mt-2 w-full">
                {issueOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setIssueType(opt.value);
                      setIssueDropdownOpen(false);
                    }}
                    className={cn(
                      'px-4 py-2 cursor-pointer hover:bg-gray-100',
                      issueType === opt.value && 'bg-gray-100 font-semibold'
                    )}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t('report_issue_form.description_label')}</label>
        <Textarea
          className="w-full text-base"
          placeholder={t('report_issue_form.description_placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t('report_issue_form.submitting_button') : t('report_issue_form.submit_button')}
      </Button>

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 p-4 rounded text-center font-medium">
          {t('report_issue_form.success_message')}
        </div>
      )}
    </div>
  );
}