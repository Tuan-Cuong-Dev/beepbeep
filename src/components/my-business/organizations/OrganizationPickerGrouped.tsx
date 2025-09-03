// src/components/my-business/organizations/OrganizationPickerGrouped.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import {
  ORG_OPTIONS_BY_CATEGORY,
  ORG_CATEGORY_LABELS,
  type OrgCategory,
  type OrgOption,
} from '@/src/components/my-business/organizations/organizationOptions';
import { useTranslation } from 'react-i18next';

const ORDER: OrgCategory[] = [
  'technical_services',
  'rental_supply',
  'transport_delivery',
  'support_tourism',
];

export default function OrganizationPickerGrouped() {
  const { t } = useTranslation('common');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const filter = (items: OrgOption[]) =>
      items.filter((it) =>
        (it.key + ' ' + it.type + ' ' + (it.subtype ?? ''))
          .toLowerCase()
          .includes(q.toLowerCase())
      );

    return {
      technical_services: filter(ORG_OPTIONS_BY_CATEGORY.technical_services),
      rental_supply: filter(ORG_OPTIONS_BY_CATEGORY.rental_supply),
      transport_delivery: filter(ORG_OPTIONS_BY_CATEGORY.transport_delivery),
      support_tourism: filter(ORG_OPTIONS_BY_CATEGORY.support_tourism),
    } as typeof ORG_OPTIONS_BY_CATEGORY;
  }, [q]);

  const empty =
    !filtered.technical_services.length &&
    !filtered.rental_supply.length &&
    !filtered.transport_delivery.length &&
    !filtered.support_tourism.length;

  return (
    <div className="space-y-8" aria-label="organization-picker">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('organization_create_chooser.search_placeholder', {
          defaultValue: 'Search organization type…',
        })}
        aria-label={t('organization_create_chooser.search_placeholder', {
          defaultValue: 'Search organization type…',
        })}
      />

      {empty && (
        <p className="text-sm text-muted-foreground">
          {t('organization_create_chooser.no_results', {
            defaultValue: 'No results. Try another keyword.',
          })}
        </p>
      )}

      {ORDER.map((cat) => {
        const items = filtered[cat];
        if (!items?.length) return null;

        return (
          <section key={cat} aria-labelledby={`section-${cat}`}>
            <h2 id={`section-${cat}`} className="text-xl font-semibold mb-3">
              {t(`organization_group.${cat}`, {
                defaultValue: ORG_CATEGORY_LABELS[cat],
              })}
            </h2>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((o) => (
                <Link
                  key={o.key}
                  href={o.path}
                  className="group flex items-start gap-3 rounded-2xl border p-4 hover:shadow-md hover:border-[#00d289] transition"
                >
                  <div className="shrink-0">{o.icon()}</div>
                  <div className="leading-tight">
                    <div className="font-semibold">
                      {t(`organization_create_chooser.${o.key}.title`, {
                        defaultValue: fallbackTitle(o),
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t(`organization_create_chooser.${o.key}.description`, {
                        defaultValue: fallbackDesc(o),
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

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
