'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  ORG_OPTIONS_BY_CATEGORY,
  ORG_CATEGORY_LABELS,
  type OrgCategory,
  type OrgOption,
} from './organizationOptions';

const ORDER: OrgCategory[] = [
  'technical_services',
  'rental_supply',
  'transport_delivery',
  'support_tourism',
];

export default function OrganizationCreateChooser() {
  const { t } = useTranslation('common');

  const getKey = (o: { key: string; type: string; subtype?: string }) =>
    `organization_create_chooser.${o.key}`;

  const title = (o: OrgOption) =>
    t(`${getKey(o)}.title`, { defaultValue: fallbackTitle(o) });

  const desc = (o: OrgOption) =>
    t(`${getKey(o)}.description`, { defaultValue: fallbackDesc(o) });

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
      <h3 className="text-base font-semibold text-gray-700 mb-4">
        👋 {t('organization_create_chooser.intro')}
      </h3>

      <div className="space-y-8">
        {ORDER.map((cat) => {
          const items = ORG_OPTIONS_BY_CATEGORY[cat];
          if (!items?.length) return null;

          return (
            <section key={cat}>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                {t(`organization_group.${cat}`, {
                  defaultValue: ORG_CATEGORY_LABELS[cat],
                })}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((option) => (
                  <Link
                    key={option.key}
                    href={option.path}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-[#00d289] hover:shadow transition"
                  >
                    <div className="flex items-start gap-3">
                      {option.icon()}
                      <div className="leading-tight">
                        <div className="font-semibold text-sm text-gray-800">
                          {title(option)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {desc(option)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- fallbacks -------------------------------- */

function fallbackTitle(o: OrgOption) {
  if (o.type === 'technician_partner')
    return o.subtype === 'shop' ? 'Cửa hàng sửa xe' : 'Kỹ thuật viên độc lập';
  switch (o.type) {
    case 'rental_company': return 'Công ty cho thuê xe';
    case 'private_provider': return 'Chủ xe cá nhân';
    case 'agent': return 'Cộng tác viên / Người giới thiệu';
    case 'city_driver': return 'Tài xế thành phố';
    case 'intercity_driver': return 'Tài xế liên tỉnh';
    case 'delivery_partner': return 'Đối tác giao hàng';
    case 'intercity_bus': return 'Nhà xe liên tỉnh';
    case 'vehicle_transport': return 'Đơn vị vận chuyển';
    case 'tour_guide': return 'Hướng dẫn viên du lịch';
    default: return o.key;
  }
}

function fallbackDesc(o: OrgOption) {
  if (o.type === 'technician_partner')
    return o.subtype === 'shop'
      ? 'Dịch vụ tại garage: sửa pin, phanh, và xe.'
      : 'Kỹ thuật viên di động cung cấp sửa chữa tận nơi.';
  switch (o.type) {
    case 'rental_company': return 'Quản lý đội xe, trạm, đơn đặt và nhân sự.';
    case 'private_provider': return 'Cho thuê xe cá nhân hoặc cung cấp dịch vụ.';
    case 'agent': return 'Giới thiệu khách hàng và nhận hoa hồng.';
    case 'city_driver': return 'Chở hành khách nội thành.';
    case 'intercity_driver': return 'Chở hành khách giữa các tỉnh.';
    case 'delivery_partner': return 'Giao kiện hàng nhỏ (≤20kg) trong nội thành.';
    case 'intercity_bus': return 'Quản lý tuyến đường & vận chuyển liên tỉnh.';
    case 'vehicle_transport': return 'Vận chuyển hàng hóa & xe cộ trong/ngoài TP.';
    case 'tour_guide': return 'Tổ chức tour xe hoặc hành trình tự lái.';
    default: return '';
  }
}
