// src/components/business/about/ServicesAboutSection.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection, getDocs, query, where, doc, getDoc,
  type FirestoreDataConverter, type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { UserService, ServiceStatus } from '@/src/lib/vehicle-services/userServiceTypes';
import { SERVICE_TYPE_ICONS } from '@/src/lib/vehicle-services/serviceTypes';
import { MapPin, Clock, FileText } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { TFunction } from 'i18next';
import { serviceFieldConfig } from '@/src/lib/vehicle-services/serviceFieldConfig';

type ServiceDoc = UserService & { id: string };

interface Props {
  businessId?: string;
  userId?: string;
  className?: string;
  statusIn?: ServiceStatus[];
  limit?: number;
}

/** ✅ Nhãn dự phòng đúng theo JSON bạn gửi */
const FALLBACK_LABELS: Record<string, string> = {
  name: 'fields.name.label',
  description: 'fields.description.label',
  location: 'fields.location.label',
  specialties: 'fields.specialties.label',
  workingHours: 'fields.workingHours.label',
  storeLocation: 'fields.storeLocation.label',
  equipment: 'fields.equipment.label',
  vehicleTypes: 'fields.vehicleTypes.label',
  pickupLocation: 'fields.pickupLocation.label',
  rentalTerms: 'fields.rentalTerms.label',
  driverExperience: 'fields.driverExperience.label',
  languages: 'fields.languages.label',
  region: 'fields.region.label',
  duration: 'fields.duration.label',
  price: 'fields.price.label',
  swapLocation: 'fields.swapLocation.label',
  supportedModels: 'fields.supportedModels.label',
  availableBatteries: 'fields.availableBatteries.label',
  deliveryArea: 'fields.deliveryArea.label',
  deliveryTime: 'fields.deliveryTime.label',
  rescueArea: 'fields.rescueArea.label',
  maxWeight: 'fields.maxWeight.label',
  routes: 'fields.routes.label',
  pricePerKm: 'fields.pricePerKm.label',
  cleaningPackages: 'fields.cleaningPackages.label',
  priceRange: 'fields.priceRange.label',
  accessoryTypes: 'fields.accessoryTypes.label',
  deliveryAvailable: 'fields.deliveryAvailable.label',
  insuranceTypes: 'fields.insuranceTypes.label',
  supportedVehicles: 'fields.supportedVehicles.label',
  policyTerms: 'fields.policyTerms.label',
  registrationArea: 'fields.registrationArea.label',
  processingTime: 'fields.processingTime.label',
};

/** 🔒 Loại bỏ các khóa hệ thống không nên hiển thị */
const META_KEYS = new Set<string>([
  'id','userId','businessId','companyId','ownerId','approverId',
  'category','serviceType','businessType','partnerType','status',
  'createdAt','updatedAt','creatorName','creatorPhotoURL',
  'name','description','coverImage','icon',
  'approveStatus','approveComment',
]);

/** 🏷️ Badge trạng thái dịch qua i18n */
function statusPill(status?: ServiceStatus, t?: TFunction<'common'>) {
  const label = t ? t(`my_service_list.status.${status}`, { defaultValue: status }) : status;
  switch (status) {
    case 'active':   return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{label}</span>;
    case 'pending':  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">{label}</span>;
    case 'inactive': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">{label}</span>;
    default:         return null;
  }
}

/** 🔁 Map option ngắn → i18n */
function mapOptionValue(t: TFunction<'common'>, v: string): string {
  const SHORT_MAP: Record<string, string> = {
    motorbike: 'options.vehicleType.motorbike',
    car: 'options.vehicleType.car',
    van: 'options.vehicleType.van',
    bus: 'options.vehicleType.bus',
    accident: 'options.insuranceType.accident',
    liability: 'options.insuranceType.liability',
    theft: 'options.insuranceType.theft',
    comprehensive: 'options.insuranceType.comprehensive',
  };
  if (v.startsWith('options.')) return t(v, { defaultValue: v.split('.').pop() });
  if (SHORT_MAP[v]) return t(SHORT_MAP[v], { defaultValue: v });
  return v;
}

/** 🧩 Lấy label từ serviceFieldConfig (nếu có), fallback sang FALLBACK_LABELS */
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

const serviceConverter: FirestoreDataConverter<UserService> = {
  toFirestore(svc: UserService) { const { id, ...rest } = svc as any; return rest; },
  fromFirestore(snapshot, options) { return snapshot.data(options) as UserService; },
};

async function getOwnerIdFromCompany(companyId?: string): Promise<string | undefined> {
  if (!companyId) return undefined;
  const snap = await getDoc(doc(db, 'rentalCompanies', companyId));
  if (!snap.exists()) return undefined;
  return (snap.data() as { ownerId?: string })?.ownerId;
}

export default function ServicesAboutSection({
  businessId, userId, className, statusIn = ['active','pending'], limit = 4,
}: Props) {
  const { t } = useTranslation('common');
  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const statusKey = useMemo(
    () => (statusIn && statusIn.length ? [...statusIn].sort().join('|') : ''),
    [statusIn]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const col = collection(db, 'services').withConverter(serviceConverter);
        const tasks: Array<Promise<QuerySnapshot<UserService>>> = [];

        if (businessId) {
          tasks.push(getDocs(query(col, where('businessId', '==', businessId))));
          tasks.push(getDocs(query(col, where('companyId', '==', businessId))));
        }

        let userIdToUse = userId;
        if (!userIdToUse && businessId) userIdToUse = await getOwnerIdFromCompany(businessId);
        if (userIdToUse) tasks.push(getDocs(query(col, where('userId', '==', userIdToUse))));

        if (!tasks.length) { if (mounted) { setServices([]); setLoading(false); } return; }

        const snapshots = await Promise.all(tasks);
        const docs = snapshots.flatMap(s => s.docs.map(d => ({ ...d.data(), id: d.id } as ServiceDoc)));
        const uniq = Array.from(new Map(docs.map(d => [d.id, d])).values());

        const filtered = statusKey
          ? uniq.filter(s => (statusIn as ServiceStatus[]).includes((s.status ?? 'active') as ServiceStatus))
          : uniq;

        if (mounted) setServices(filtered);
      } catch {
        if (mounted) setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [businessId, userId, statusKey]);

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
        <p className="text-sm text-gray-500">{t('services_about.empty', { defaultValue: 'No services yet.' })}</p>
      </section>
    );
  }

  /** ✅ Toàn bộ keys ưu tiên hiển thị (khớp JSON) */
  const preferredKeys = [
    'location','storeLocation','workingHours','rentalTerms',
    'vehicleTypes','supportedVehicles','availableBatteries','pricePerKm',
    'specialties','equipment','pickupLocation','driverExperience',
    'languages','region','duration','price','swapLocation',
    'supportedModels','deliveryArea','deliveryTime','rescueArea',
    'maxWeight','routes','cleaningPackages','priceRange',
    'accessoryTypes','deliveryAvailable','insuranceTypes',
    'policyTerms','registrationArea','processingTime',
  ];

  const shouldShow = (k: string, v: unknown) => {
    if (META_KEYS.has(k)) return false;
    if (k.endsWith('Id')) return false;       // ẩn mọi *Id
    if (k.startsWith('_')) return false;
    if (v === undefined || v === null || v === '') return false;
    return true;
  };

  const translateLabel = (t: TFunction<'common'>, labelIndex: Map<string,string>, key: string) =>
    t(labelIndex.get(key) || FALLBACK_LABELS[key] || key, { defaultValue: key });

  const formatValue = (t: TFunction<'common'>, val: unknown): string => {
    if (Array.isArray(val)) return (val as unknown[]).map(v => mapOptionValue(t, String(v))).join(', ');
    if (typeof val === 'boolean') return t(val ? 'common.yes' : 'common.no', { defaultValue: val ? 'Yes' : 'No' });
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      if (val.startsWith('options.')) return t(val, { defaultValue: val.split('.').pop() });
      return val;
    }
    return String(val ?? '');
  };

  return (
    <section className={cn('bg-white border border-gray-200 rounded-lg shadow-sm p-5 sm:p-6', className)}>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
        {t('services_about.title', { defaultValue: 'Dịch vụ của bạn' })}
      </h2>

      <div className="mt-4 space-y-5">
        {items.map((svc) => {
          const fields = resolveFieldsByService(svc);
          const labelIndex = new Map<string, string>();
          fields.forEach((f) => labelIndex.set(f.name, f.label));

          const baseEntries: Array<[string, unknown]> = preferredKeys
            .map((k) => [k, (svc as any)[k]] as [string, unknown])
            .filter(([k, v]) => shouldShow(k, v));

          let extras: Array<[string, unknown]> = [];
          if (baseEntries.length < 3) {
            extras = Object.entries(svc as Record<string, unknown>)
              .filter(([k, v]) => shouldShow(k, v) && !preferredKeys.includes(k))
              .slice(0, 3 - baseEntries.length);
          }
          const entries = [...baseEntries, ...extras];

          return (
            <div key={svc.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {SERVICE_TYPE_ICONS[svc.serviceType] ?? <FileText className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{svc.name}</h3>
                    {statusPill(svc.status, t)}
                  </div>

                  {svc.description && (
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words line-clamp-4 md:line-clamp-6">
                      {svc.description}
                    </p>
                  )}
                </div>
              </div>

              {entries.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {entries.map(([k, v]) => {
                    const label = translateLabel(t, labelIndex, k);
                    const text  = formatValue(t, v);
                    const icon =
                      k === 'location' || k === 'storeLocation' ? <MapPin className="size-3.5" /> :
                      k === 'workingHours' ? <Clock className="size-3.5" /> :
                      k === 'rentalTerms' ? <FileText className="size-3.5" /> :
                      undefined;
                    return <InfoRow key={k} icon={icon} label={label} value={text} />;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
