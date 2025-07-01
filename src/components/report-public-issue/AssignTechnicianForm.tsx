'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '../ui/button';
import { SimpleSelect } from '../ui/select';
import Image from 'next/image';

interface Props {
  onAssign: (userId: string) => void;
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

  useEffect(() => {
    const fetchPartners = async () => {
      const q = query(collection(db, 'technicianPartners'), where('isActive', '==', true));
      const snap = await getDocs(q);

      const partners: TechnicianPartner[] = snap.docs
        .map((doc) => {
          const data = doc.data();
          if (!data.userId) return null;

          return {
            userId: data.userId,
            name: data.name || '(Unnamed Partner)',
            avatarUrl: data.avatarUrl || '/assets/images/technician.png',
            serviceCategories: data.serviceCategories || [],
            assignedRegions: data.assignedRegions || [],
          };
        })
        .filter(Boolean) as TechnicianPartner[];

      const filtered = partners.filter((partner) => {
        const matchCategory = filterCategory
          ? partner.serviceCategories?.includes(filterCategory)
          : true;
        const matchRegion = filterRegion
          ? partner.assignedRegions?.includes(filterRegion)
          : true;
        return matchCategory && matchRegion;
      });

      setTechnicians(filtered);
    };

    fetchPartners();
  }, [filterCategory, filterRegion]);

  useEffect(() => {
    if (technicians.length > 0 && !selectedUserId) {
      setSelectedUserId(technicians[0].userId);
    }
  }, [technicians]);

  const options = technicians.map((tech) => ({
    value: tech.userId,
    label: tech.name,
  }));

  const selectedTech = technicians.find((t) => t.userId === selectedUserId);

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
            {selectedTech?.serviceCategories?.length ? (
              <div className="text-sm text-gray-500">
                {selectedTech.serviceCategories.join(', ')}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Button
        disabled={!selectedUserId}
        onClick={() => onAssign(selectedUserId)}
        className="w-full"
      >
        Assign Technician
      </Button>
    </div>
  );
}
