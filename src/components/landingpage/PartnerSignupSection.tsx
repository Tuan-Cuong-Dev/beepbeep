// src/components/landingpage/PartnerSignupSection.tsx
'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ORG_OPTIONS, type OrgOption } from '@/src/components/my-business/organizations/organizationOptions';
import { Plus } from 'lucide-react'; // icon dấu cộng cho ô "Xem tất cả"

export default function PartnerSignupSection() {
  const { t } = useTranslation('common');

  // Lấy đúng 11 loại đầu tiên, còn lại sẽ gom trong "Xem tất cả"
  const items = ORG_OPTIONS.slice(0, 11);

  return (
    <section className="font-sans mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold">
          {t('partner_signup.title', { defaultValue: 'Đăng ký làm đối tác Bíp Bíp' })}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('partner_signup.subtitle', {
            defaultValue:
              'Kiếm thu nhập cùng hệ sinh thái di chuyển & cho thuê xe. Chọn vai trò phù hợp và bắt đầu ngay.',
          })}
        </p>
      </div>

      {/* Grid: luôn 6 cột, 2 hàng (12 ô) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
        {items.map((o) => (
          <IconTile key={o.key} option={o} />
        ))}

        {/* Ô “Xem tất cả” */}
        <Link
          href="/my-business/create"
          className="flex flex-col items-center justify-center rounded-2xl border bg-white py-6 hover:border-[#00d289] hover:shadow-sm transition"
        >
          <div className="mb-2 text-[#00d289]">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <div className="text-xs md:text-sm font-medium text-gray-800 text-center">
            {t('partner_signup.view_all', { defaultValue: 'Xem tất cả' })}
          </div>
        </Link>
      </div>
    </section>
  );
}

function IconTile({ option }: { option: OrgOption }) {
  const { t } = useTranslation('common');
  const base = `organization_create_chooser.${option.key}`;
  const title = t(`${base}.title`, { defaultValue: fallbackTitle(option) });

  return (
    <Link
      href={option.path}
      className="group flex flex-col items-center justify-center rounded-2xl border bg-white py-6 hover:border-[#00d289] hover:shadow-sm transition"
      aria-label={title}
    >
      <div className="mb-2">{option.icon()}</div>
      <div className="text-xs md:text-sm font-medium text-gray-800 text-center">
        {title}
      </div>
    </Link>
  );
}

/* ----------------------------- Fallback titles ----------------------------- */
function fallbackTitle(o: OrgOption) {
  if (o.type === 'technician_partner')
    return o.subtype === 'shop' ? 'Cửa hàng sửa xe' : 'Kỹ thuật viên lưu động';
  switch (o.type) {
    case 'rental_company': return 'Công ty cho thuê xe';
    case 'private_provider': return 'Chủ xe cá nhân';
    case 'agent': return 'Cộng tác viên';
    case 'city_driver': return 'Tài xế thành phố';
    case 'intercity_driver': return 'Tài xế liên tỉnh';
    case 'delivery_partner': return 'Đối tác giao hàng';
    case 'intercity_bus': return 'Nhà xe liên tỉnh';
    case 'vehicle_transport': return 'Đơn vị vận chuyển';
    case 'tour_guide': return 'Hướng dẫn viên du lịch';
    default: return o.key;
  }
}
