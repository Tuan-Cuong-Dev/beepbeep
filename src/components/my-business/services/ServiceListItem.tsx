'use client';

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { serviceFieldConfig } from '@/src/lib/vehicle-services/serviceFieldConfig';
import { SupportedServiceType, SERVICE_TYPE_ICONS } from '@/src/lib/vehicle-services/serviceTypes';
import type { ServiceStatus, UserService } from '@/src/lib/vehicle-services/userServiceTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  service: UserService;
  onEdit: (service: UserService) => void;
  onDelete: (id: string) => void;
}

type SimpleField = { name: string; label: string };

/** 🏷️ Fallback labels nếu field không có trong config */
const FALLBACK_LABELS: Record<string, string> = {
  location: 'fields.location.label',
  storeLocation: 'fields.storeLocation.label',
  workingHours: 'fields.workingHours.label',
  rentalTerms: 'fields.rentalTerms.label',
  driverExperience: 'fields.driverExperience.label',
  equipment: 'fields.equipment.label',
  specialties: 'fields.specialties.label',
  deliveryArea: 'fields.deliveryArea.label',
  deliveryTime: 'fields.deliveryTime.label',
  supportedModels: 'fields.supportedModels.label',
  availableBatteries: 'fields.availableBatteries.label',
  maxWeight: 'fields.maxWeight.label',
  routes: 'fields.routes.label',
  cleaningPackages: 'fields.cleaningPackages.label',
  priceRange: 'fields.priceRange.label',
  accessoryTypes: 'fields.accessoryTypes.label',
  deliveryAvailable: 'fields.deliveryAvailable.label',
  policyTerms: 'fields.policyTerms.label',
  processingTime: 'fields.processingTime.label',
  region: 'fields.region.label',
  duration: 'fields.duration.label',
  price: 'fields.price.label',

  // multi
  vehicleTypes: 'fields.vehicleTypes.label',
  supportedVehicles: 'fields.supportedVehicles.label',
  languages: 'fields.languages.label',
  insuranceTypes: 'fields.insuranceTypes.label',
};

/** 🧹 Field meta không hiển thị */
const META_KEYS = new Set<string>([
  'id',
  'userId',
  'category',
  'serviceType',
  'status',
  'createdAt',
  'updatedAt',
  'creatorName',
  'creatorPhotoURL',
  'name',
  'description',
  'partnerType',
]);

/** 🔖 Style theo status ('active' | 'pending' | 'inactive') */
const STATUS_CLASS: Record<ServiceStatus, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-200 text-gray-600',
};

/** 🔁 Chuẩn hoá hiển thị giá trị option (vehicle/insurance) — KHÔNG map code ngôn ngữ */
function mapOptionValue(t: TFunction<'common'>, v: string): string {
  const SHORT_MAP: Record<string, string> = {
    // vehicle types
    motorbike: 'options.vehicleType.motorbike',
    car: 'options.vehicleType.car',
    van: 'options.vehicleType.van',
    bus: 'options.vehicleType.bus',
    // insurance types
    accident: 'options.insuranceType.accident',
    liability: 'options.insuranceType.liability',
    theft: 'options.insuranceType.theft',
    comprehensive: 'options.insuranceType.comprehensive',
  };

  if (v.startsWith('options.')) return t(v, { defaultValue: v.split('.').pop() });
  if (SHORT_MAP[v]) return t(SHORT_MAP[v], { defaultValue: v });
  return v; // en/vi/ko/ja hoặc text thường giữ nguyên
}

/** 🧭 Resolve field config theo service (kể cả nhánh partnerType) */
function resolveFieldsByService(service: UserService): SimpleField[] {
  const raw = (serviceFieldConfig as any)?.[service.category]?.[service.serviceType];
  if (Array.isArray(raw)) return raw as SimpleField[];
  const pt = (service as Record<string, unknown>)['partnerType'];
  const byPartner = typeof pt === 'string' ? raw?.[pt as 'mobile' | 'shop'] : undefined;
  return (byPartner as SimpleField[]) ?? [];
}

export default function ServiceListItem({ service, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common');

  const statusStyle = STATUS_CLASS[service.status] ?? 'bg-gray-200 text-gray-600';

  // 1) Field từ config
  const resolvedFields = resolveFieldsByService(service);

  // 2) name -> label index
  const labelIndex = new Map<string, string>();
  resolvedFields.forEach((f: SimpleField) => labelIndex.set(f.name, f.label));

  // 3) Các field đã show riêng
  const shownKeys = new Set<string>(['name', 'description', 'vehicleTypes']);

  // 4) Subtitle vehicleTypes
  const subtitleVehicleTypes =
    Array.isArray((service as Record<string, unknown>).vehicleTypes)
      ? ((service as Record<string, unknown>).vehicleTypes as string[])
          .map((v: string) => mapOptionValue(t, v))
          .join(', ')
      : '';

  // 5) Gom field hiển thị (primary từ config + extra từ object)
  const svcObj = service as Record<string, unknown>;

  const primaryEntries: Array<[string, unknown]> = resolvedFields
    .map((f) => [f.name, svcObj[f.name]] as [string, unknown])
    .filter(([, v]) => v !== undefined && v !== '');

  const extraEntries: Array<[string, unknown]> = Object.entries(
    svcObj as Record<string, unknown>
  )
    .filter(([k]: [string, unknown]) => !META_KEYS.has(k) && !shownKeys.has(k) && !labelIndex.has(k))
    .filter(([, v]: [string, unknown]) => v !== undefined && v !== '');

  const entriesToRender: Array<[string, unknown]> = [...primaryEntries, ...extraEntries];

  const translateLabel = (key: string): string => {
    const labelKey = labelIndex.get(key) || FALLBACK_LABELS[key] || key;
    return t(labelKey, { defaultValue: key });
  };

  const formatValue = (val: unknown): string => {
    if (Array.isArray(val)) {
      return (val as unknown[]).map((v: unknown) => mapOptionValue(t, String(v))).join(', ');
    }
    if (typeof val === 'boolean') {
      return t(val ? 'common.yes' : 'common.no', { defaultValue: val ? 'Yes' : 'No' });
    }
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      if (val.startsWith('options.')) return t(val, { defaultValue: val.split('.').pop() });
      return val;
    }
    return String(val ?? '');
  };

  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white">
      <div className="flex justify-between items-start">
        {/* LEFT */}
        <div className="flex-1 space-y-2">
          {/* Icon + Title */}
          <div className="flex items-center gap-2">
            {SERVICE_TYPE_ICONS[service.serviceType as SupportedServiceType]}
            <h4 className="text-base font-semibold text-gray-800">{service.name}</h4>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-gray-500">
            {t(`service_labels.${service.serviceType}`, { defaultValue: service.serviceType })}
            {subtitleVehicleTypes ? <> • {subtitleVehicleTypes}</> : null}
          </p>

          {/* Description */}
          <p className="text-sm text-gray-600">
            {service.description?.trim()
              ? service.description
              : t('my_service_list.description_placeholder', {
                  defaultValue:
                    'Optional description about your service (e.g. pricing, specialties, working hours...)',
                })}
          </p>

          {/* Dynamic + Extra fields */}
          {entriesToRender.length > 0 && (
            <div className="space-y-1">
              {entriesToRender.map(([key, value]: [string, unknown]) => (
                <div key={key} className="text-sm text-gray-600">
                  <span className="font-medium">{translateLabel(key)}:</span>{' '}
                  {formatValue(value)}
                </div>
              ))}
            </div>
          )}

          {/* Creator */}
          {'creatorName' in service && service.creatorName && (
            <div className="flex items-center gap-2 pt-2">
              {'creatorPhotoURL' in service && service.creatorPhotoURL ? (
                <img
                  src={service.creatorPhotoURL as string}
                  alt={service.creatorName as string}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <span className="text-sm text-gray-500">{String(service.creatorName)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Button size="sm" variant="outline" onClick={() => onEdit(service)}>
              {t('common.edit')}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(String(service.id))}>
              {t('common.delete')}
            </Button>
          </div>
        </div>

        {/* RIGHT: Status */}
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-4 ${statusStyle}`}>
          {t(`my_service_list.status.${service.status}`, { defaultValue: service.status })}
        </span>
      </div>
    </div>
  );
}
