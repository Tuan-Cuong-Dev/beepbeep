// Cần thiết kế thông minh hơn dựa vào nhiều yếu tố để cho Trợ lý có thể 
// giao việc cho đúng kỹ thuật viên phù hợp với lỗi của khách hàng


'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '../ui/button';
import { SimpleSelect } from '../ui/select';
import Image from 'next/image';

interface Props {
  // chấp nhận cả sync/async
  onAssign: (userId: string, name: string) => void | Promise<void>;
  filterCategory?: string;
  filterRegion?: string;
}

interface TechnicianPartner {
  userId: string;
  name: string;
  avatarUrl?: string;
  serviceCategories?: string[];
  assignedRegions?: string[];
}

export default function AssignTechnicianForm({
  onAssign,
  filterCategory,
  filterRegion,
}: Props) {
  const [technicians, setTechnicians] = useState<TechnicianPartner[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'technicianPartners'),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);

        const partners: TechnicianPartner[] = snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              userId: doc.id, // ✅ thay vì data.userId
              name: data.name || '(Unnamed Partner)',
              avatarUrl: data.avatarUrl || '/assets/images/technician.png',
              serviceCategories: data.serviceCategories || [],
              assignedRegions: data.assignedRegions || [],
            } as TechnicianPartner;
          })
          .filter(Boolean) as TechnicianPartner[];

        const filtered = partners.filter((p) => {
          const matchCategory = filterCategory
            ? p.serviceCategories?.includes(filterCategory)
            : true;
          const matchRegion = filterRegion
            ? p.assignedRegions?.includes(filterRegion)
            : true;
          return matchCategory && matchRegion;
        });

        setTechnicians(filtered);

        // ✅ auto-chọn kỹ thuật viên đầu tiên nếu chưa chọn
        if (filtered.length > 0 && !selectedUserId) {
          setSelectedUserId(filtered[0].userId);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
    // chỉ phụ thuộc bộ lọc; không phụ thuộc selectedUserId để tránh loop
  }, [filterCategory, filterRegion]);

  const options = technicians.map((tech) => ({
    value: tech.userId,
    label: tech.name,
  }));

  const selectedTech = technicians.find((t) => t.userId === selectedUserId);

  const handleAssignClick = async () => {
    if (!selectedUserId) return;
    await onAssign(selectedUserId, selectedTech?.name ?? '');
  };

  return (
    <div className="space-y-4">
      <SimpleSelect
        options={options}
        placeholder="Select Technician Partner"
        value={selectedUserId}
        onChange={setSelectedUserId}
      />

      {selectedTech && (
        <div className="flex items-center space-x-2">
          <Image
            src={selectedTech.avatarUrl || '/assets/images/technician.png'}
            alt={selectedTech.name}
            width={40}
            height={40}
            className="rounded-full border"
          />
          <div>
            <div className="font-semibold">{selectedTech.name}</div>
            {!!selectedTech?.serviceCategories?.length && (
              <div className="text-sm text-gray-500">
                {selectedTech.serviceCategories.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <Button
        disabled={loading || !selectedUserId}
        onClick={handleAssignClick}
        className="w-full"
      >
        {loading ? 'Loading...' : 'Assign Technician'}
      </Button>

      {/* Gợi ý debug nhanh nếu vẫn không có ai để chọn */}
      {(!loading && technicians.length === 0) && (
        <p className="text-sm text-gray-500">
          No active technician partners match the current filters.
          {/* Kiểm tra: isActive=true? userId hay doc.id? filterCategory/Region có khớp không? */}
        </p>
      )}
    </div>
  );
}
