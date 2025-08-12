// src/components/business/about/ServicesAboutSection.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { UserService, ServiceStatus } from '@/src/lib/vehicle-services/userServiceTypes';
import { SERVICE_TYPE_ICONS } from '@/src/lib/vehicle-services/serviceTypes';
import { MapPin, Clock, FileText } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { TFunction } from 'i18next';
import { serviceFieldConfig } from '@/src/lib/vehicle-services/serviceFieldConfig';

type ServiceDoc = UserService & { id: string };

interface Props {
  businessId?: string;    // nếu services gắn business/company
  userId?: string;        // nếu services gắn user
  className?: string;
  /** Mặc định: hiển thị active + pending để thấy dịch vụ mới tạo */
  statusIn?: ServiceStatus[];
  limit?: number;
}

const FALLBACK_LABELS: Record<string, string> = {
  location: 'fields.location.label',
  storeLocation: 'fields.storeLocation.label',
  workingHours: 'fields.workingHours.label',
  rentalTerms: 'fields.rentalTerms.label',
  vehicleTypes: 'fields.vehicleTypes.label',
  supportedVehicles: 'fields.supportedVehicles.label',
  pricePerKm: 'fields.pricePerKm.label',
  availableBatteries: 'fields.availableBatteries.label',
};

const META_KEYS = new Set<string>([
  'id', 'userId', 'businessId', 'companyId',
  'category', 'serviceType', 'status',
  'createdAt', 'updatedAt', 'creatorName', 'creatorPhotoURL',
  'partnerType', 'description', 'name',
]);

function mapOptionValue(t: TFunction<'common'>, v: string): string {
  const SHORT_MAP: Record<string, string> = {
    // vehicle
    motorbike: 'options.vehicleType.motorbike',
    car: 'options.vehicleType.car',
    van: 'options.vehicleType.van',
    bus: 'options.vehicleType.bus',
    // insurance
    accident: 'options.insuranceType.accident',
    liability: 'options.insuranceType.liability',
    theft: 'options.insuranceType.theft',
    comprehensive: 'options.insuranceType.comprehensive',
  };
  if (v.startsWith('options.')) return t(v, { defaultValue: v.split('.').pop() });
  if (SHORT_MAP[v]) return t(SHORT_MAP[v], { defaultValue: v });
  return v;
}

function resolveFieldsByService(svc: ServiceDoc): Array<{ name: string; label: string }> {
  const raw = (serviceFieldConfig as any)?.[svc.category]?.[svc.serviceType];
  if (Array.isArray(raw)) return raw as Array<{ name: string; label: string }>;
  const pt = (svc as any).partnerType;
  const byPartner = (pt && raw?.[pt as 'mobile' | 'shop']) || [];
  return (byPartner as Array<{ name: string; label: string }>) ?? [];
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3 hover:border-gray-200">
      {icon ? <div className="mt-[2px] text-gray-500 shrink-0">{icon}</div> : null}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ServicesAboutSection({
  businessId,
  userId,
  className,
  statusIn = ['active', 'pending'],
  limit = 4,
}: Props) {
  const { t } = useTranslation('common');
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const col = collection(db, 'services');
        const queries: Promise<any>[] = [];

        if (businessId) {
          queries.push(getDocs(query(col, where('businessId', '==', businessId))));
          queries.push(getDocs(query(col, where('companyId', '==', businessId))));
        }
        if (userId) {
          queries.push(getDocs(query(col, where('userId', '==', userId))));
        }

        if (queries.length === 0) {
          if (mounted) { setServices([]); setLoading(false); }
          return;
        }

        const snapshots = await Promise.all(queries);
        const docs = snapshots.flatMap(s =>
          s.docs.map((d: { id: any; data: () => any; }) => ({ id: d.id, ...(d.data() as any) } as ServiceDoc))
        );

        // dedup theo id
        const map = new Map(docs.map(d => [d.id, d]));
        let list = Array.from(map.values());

        // lọc status (nếu được cấu hình)
        if (statusIn?.length) {
          list = list.filter(s => statusIn.includes(s.status));
        }

        if (mounted) setServices(list);
      } catch {
        if (mounted) setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [businessId, userId, statusIn]);

  const items = useMemo(() => services.slice(0, limit), [services, limit]);

  if (loading) {
    return (
      <section className={cn('bg-white border border-gray-200 rounded-lg p-5 shadow-sm', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className={cn('bg-white border border-gray-200 rounded-lg p-5 shadow-sm', className)}>
        <p className="text-sm text-gray-500">
          {t('services_about.empty', { defaultValue: 'No services yet.' })}
        </p>
      </section>
    );
  }

  return (
    <section className={cn('bg-white border border-gray-200 rounded-lg shadow-sm p-5 sm:p-6', className)}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
        {t('services_about.title', { defaultValue: 'Services' })}
      </h2>

      <div className="mt-4 space-y-5">
        {items.map((svc) => {
          const fields = resolveFieldsByService(svc);
          const labelIndex = new Map<string, string>();
          fields.forEach((f) => labelIndex.set(f.name, f.label));

          const preferredKeys = [
            'location', 'storeLocation', 'workingHours', 'rentalTerms',
            'vehicleTypes', 'supportedVehicles', 'availableBatteries', 'pricePerKm',
          ];

          const entries: Array<[string, unknown]> = preferredKeys
            .map((k) => [k, (svc as any)[k]] as [string, unknown])
            .filter(([, v]) => v !== undefined && v !== '' && v !== null);

          if (entries.length < 3) {
            const extras = Object.entries(svc as Record<string, unknown>)
              .filter(([k, v]) => !META_KEYS.has(k) && v !== undefined && v !== '')
              .filter(([k]) => !preferredKeys.includes(k))
              .slice(0, 3 - entries.length);
            entries.push(...extras);
          }

          const translateLabel = (key: string) =>
            t(labelIndex.get(key) || FALLBACK_LABELS[key] || key, { defaultValue: key });

          const formatValue = (val: unknown): string => {
            if (Array.isArray(val)) {
              return (val as unknown[]).map((v) => mapOptionValue(t, String(v))).join(', ');
            }
            if (typeof val === 'boolean') return t(val ? 'common.yes' : 'common.no', { defaultValue: val ? 'Yes' : 'No' });
            if (typeof val === 'number') return String(val);
            if (typeof val === 'string') {
              if (val.startsWith('options.')) return t(val, { defaultValue: val.split('.').pop() });
              return val;
            }
            return String(val ?? '');
          };

          return (
            <div key={svc.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{SERVICE_TYPE_ICONS[svc.serviceType]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{svc.name}</h3>
                    {svc.status === 'active' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        {t('my_service_list.status.active', { defaultValue: 'Active' })}
                      </span>
                    )}
                  </div>
                  {svc.description && <p className="text-xs text-gray-600 line-clamp-2">{svc.description}</p>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {entries.map(([k, v]) => {
                  const label = translateLabel(k);
                  const text  = formatValue(v);
                  const icon =
                    k === 'location' || k === 'storeLocation' ? <MapPin className="size-3.5" /> :
                    k === 'workingHours' ? <Clock className="size-3.5" /> :
                    k === 'rentalTerms' ? <FileText className="size-3.5" /> :
                    undefined;

                  return <InfoRow key={k} icon={icon} label={label} value={text} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
