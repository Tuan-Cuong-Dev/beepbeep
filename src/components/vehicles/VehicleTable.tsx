'use client';

import { useEffect, useState } from 'react';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { Button } from '@/src/components/ui/button';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import QRCode from 'react-qr-code';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicles: Vehicle[];
  models: VehicleModel[];
  stations: RentalStation[];
  setvehicles: (list: Vehicle[]) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDeleteConfirm: (vehicle: Vehicle) => void;
  companyId: string;
  showStationColumn: boolean;
}

export default function VehicleTable({
  vehicles,
  models,
  stations,
  setvehicles,
  onEdit,
  onDeleteConfirm,
  companyId,
  showStationColumn,
}: Props) {
  const { t } = useTranslation('common');
  const [mapModel, setMapModel] = useState<Record<string, string>>({});
  const [mapStation, setMapStation] = useState<Record<string, string>>({});
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  const statusOrder = ['Available', 'Reserved', 'In Use', 'Under Maintenance', 'Broken', 'Sold'];

  const sortedvehicles = [...vehicles].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  useEffect(() => {
    const modelMap: Record<string, string> = {};
    models.forEach((m) => (modelMap[m.id] = m.name));
    setMapModel(modelMap);

    const stationMap: Record<string, string> = {};
    stations.forEach((s) => (stationMap[s.id] = s.name));
    setMapStation(stationMap);
  }, [models, stations]);

  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'rentalCompanies'));
        const map: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          map[docSnap.id] = data.name || t('vehicle_table.Unknown Company');
        });
        setCompanyMap(map);
      } catch (err) {
        console.error('❌ Error fetching company names:', err);
      }
    };

    fetchCompanyNames();
  }, [t]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">{t('vehicle_table.Vehicle List')}</h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 border">{t('vehicle_table.Model')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Serial')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Vehicle ID')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.QR Code')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Plate')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Color')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.ODO')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Battery')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Range')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Status')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Location')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Note')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Price/Hour')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Price/Day')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Price/Week')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Price/Month')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Station Name')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Company')}</th>
              <th className="px-3 py-2 border">{t('vehicle_table.Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedvehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border font-medium whitespace-nowrap">{mapModel[vehicle.modelId] || '-'}</td>
                <td className="px-3 py-2 border">{vehicle.serialNumber}</td>
                <td className="px-3 py-2 border">{vehicle.vehicleID}</td>
                <td className="px-3 py-2 border">
                  {vehicle.id && (
                    <div className="w-16 h-16">
                      <QRCode value={vehicle.id} size={64} />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 border">{vehicle.plateNumber}</td>
                <td className="px-3 py-2 border">{vehicle.color || '-'}</td>
                <td className="px-3 py-2 border">{vehicle.odo} km</td>
                <td className="px-3 py-2 border">{vehicle.batteryCapacity}</td>
                <td className="px-3 py-2 border">{vehicle.range} km</td>
                <td className="px-3 py-2 border">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    vehicle.status === 'Available'
                      ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'Reserved'
                      ? 'bg-blue-100 text-blue-800'
                      : vehicle.status === 'In Use'
                      ? 'bg-orange-100 text-orange-800'
                      : vehicle.status === 'Under Maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : vehicle.status === 'Broken'
                      ? 'bg-red-100 text-red-800'
                      : vehicle.status === 'Sold'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {t(`vehicle_status.${vehicle.status}`)}
                  </span>
                </td>
                <td className="px-3 py-2 border">
                  {t(`vehicle_table.${vehicle.currentLocation || 'Unknown'}`)}
                </td>
                <td className="px-3 py-2 border">{vehicle.note || '-'}</td>
                <td className="px-3 py-2 border text-right whitespace-nowrap">
                  {vehicle.pricePerHour !== undefined ? formatCurrency(vehicle.pricePerHour) : '-'}
                </td>
                <td className="px-3 py-2 border text-right whitespace-nowrap">
                  {formatCurrency(vehicle.pricePerDay)}
                </td>
                <td className="px-3 py-2 border text-right whitespace-nowrap">
                  {vehicle.pricePerWeek !== undefined ? formatCurrency(vehicle.pricePerWeek) : '-'}
                </td>
                <td className="px-3 py-2 border text-right whitespace-nowrap">
                  {vehicle.pricePerMonth !== undefined ? formatCurrency(vehicle.pricePerMonth) : '-'}
                </td>

                <td className="px-3 py-2 border">{mapStation[vehicle.stationId] || '-'}</td>
                <td className="px-3 py-2 border">{companyMap[vehicle.companyId] || t('vehicle_table.Unknown')}</td>
                <td className="px-3 py-2 border">
                  <div className="flex justify-center items-center gap-2 h-full">
                    <Button size="sm" className="h-8" onClick={() => onEdit(vehicle)}>
                      {t('vehicle_table.Edit')}
                    </Button>
                    <Button size="sm" className="h-8" variant="destructive" onClick={() => onDeleteConfirm(vehicle)}>
                      {t('vehicle_table.Delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
          {sortedvehicles.map((vehicle) => {
            const statusClass =
              vehicle.status === 'Available'
                ? 'bg-green-100 text-green-800'
                : vehicle.status === 'Reserved'
                ? 'bg-blue-100 text-blue-800'
                : vehicle.status === 'In Use'
                ? 'bg-orange-100 text-orange-800'
                : vehicle.status === 'Under Maintenance'
                ? 'bg-yellow-100 text-yellow-800'
                : vehicle.status === 'Broken'
                ? 'bg-red-100 text-red-800'
                : vehicle.status === 'Sold'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-700';

            return (
              <div key={vehicle.id} className="bg-gray-50 rounded-lg shadow p-4">
                {/* Header: Model + Plate */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold leading-snug line-clamp-2">
                      {mapModel[vehicle.modelId] || '-'}
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-nowrap">
                      {t('vehicle_table.Plate')}: {vehicle.plateNumber || '-'}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2 py-1 rounded self-start ${statusClass}`}>
                    {t(`vehicle_status.${vehicle.status}`)}
                  </span>
                </div>

                {/* Meta grid */}
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="text-gray-500">{t('vehicle_table.Serial')}</div>
                  <div
                    className="text-right font-medium whitespace-nowrap"
                    title={vehicle.serialNumber || '-'}
                  >
                    {vehicle.serialNumber
                      ? `...${vehicle.serialNumber.slice(-18)}`
                      : '-'}
                  </div>

                  <div className="text-gray-500">{t('vehicle_table.Vehicle ID')}</div>
                  <div className="text-right font-medium whitespace-nowrap">
                    {vehicle.vehicleID || '-'}
                  </div>

                  <div className="text-gray-500">{t('vehicle_table.Price/Day')}</div>
                  <div className="text-right font-medium whitespace-nowrap">
                    {formatCurrency(vehicle.pricePerDay)}
                  </div>

                  <div className="text-gray-500">{t('vehicle_table.Station Name')}</div>
                  <div className="text-right font-medium line-clamp-1">
                    {mapStation[vehicle.stationId] || '-'}
                  </div>

                  <div className="text-gray-500">{t('vehicle_location')}</div>
                  <div className="text-right font-medium line-clamp-1">
                    <td className="px-3 py-2 border">
                      {t(`vehicle_table.${vehicle.currentLocation || 'Unknown'}`)}
                    </td>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
