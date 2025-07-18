'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Label } from '@/src/components/ui/label';

export default function RepairShopEditForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { updatePartner } = useTechnicianPartners();
  const [partner, setPartner] = useState<Partial<TechnicianPartner> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const ref = doc(db, 'technicianPartners', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPartner(snap.data() as TechnicianPartner);
      }
    };
    fetch();
  }, [id]);

  const handleChange = (field: keyof TechnicianPartner, value: any) => {
    setPartner((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!partner) return;
    setSaving(true);
    try {
      await updatePartner(id, {
        shopName: partner.shopName || '',
        shopAddress: partner.shopAddress || '',
        phone: partner.phone || '',
        email: partner.email || '',
        type: partner.type || 'shop',
        isActive: partner.isActive ?? true,
        vehicleType: partner.vehicleType || 'motorbike',
        serviceCategories: partner.serviceCategories || [],
        workingHours: partner.workingHours || [],
        assignedRegions: partner.assignedRegions || [],
        mapAddress: partner.mapAddress || '',
        coordinates: partner.coordinates || undefined,
        geo: partner.geo || undefined,
      });
      onClose();
    } catch (err) {
      alert('Lỗi khi cập nhật tiệm sửa xe.');
    } finally {
      setSaving(false);
    }
  };

  if (!partner) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="shopName">Tên tiệm sửa xe</Label>
        <Input
          id="shopName"
          value={partner.shopName || ''}
          onChange={(e) => handleChange('shopName', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="shopAddress">Địa chỉ</Label>
        <Input
          id="shopAddress"
          value={partner.shopAddress || ''}
          onChange={(e) => handleChange('shopAddress', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input
          id="phone"
          value={partner.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>
    </div>
  );
}
