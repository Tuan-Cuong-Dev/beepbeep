'use client';

import { useEffect, useState } from 'react';
import { Ebike } from '@/src/lib/vehicles/vehicleTypes';
import { EbikeModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { Button } from '@/src/components/ui/button';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import QRCode from 'react-qr-code';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Props {
  ebikes: Ebike[];
  models: EbikeModel[];
  stations: RentalStation[];
  setEbikes: (list: Ebike[]) => void;
  onEdit: (bike: Ebike) => void;
  onDeleteConfirm: (bike: Ebike) => void;
  companyId: string;
  showStationColumn: boolean;
}

export default function EbikeTable({
  ebikes,
  models,
  stations,
  setEbikes,
  onEdit,
  onDeleteConfirm,
  companyId,
  showStationColumn,
}: Props) {
  const [mapModel, setMapModel] = useState<Record<string, string>>({});
  const [mapStation, setMapStation] = useState<Record<string, string>>({});
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  const statusOrder = ['Available', 'Reserved', 'In Use', 'Under Maintenance', 'Broken', 'Sold'];

  const sortedEbikes = [...ebikes].sort(
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
          map[docSnap.id] = data.name || 'Unknown Company';
        });
        setCompanyMap(map);
      } catch (err) {
        console.error('❌ Error fetching company names:', err);
      }
    };

    fetchCompanyNames();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Vehicle List</h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 border">Model</th>
              <th className="px-3 py-2 border">Serial</th>
              <th className="px-3 py-2 border">Vehicle ID</th>
              <th className="px-3 py-2 border">QR Code</th>
              <th className="px-3 py-2 border">Plate</th>
              <th className="px-3 py-2 border">Color</th>
              <th className="px-3 py-2 border">ODO</th>
              <th className="px-3 py-2 border">Battery</th>
              <th className="px-3 py-2 border">Range</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Note</th>
              <th className="px-3 py-2 border">Price/Hour</th>
              <th className="px-3 py-2 border">Price/Day</th>
              <th className="px-3 py-2 border">Price/Week</th>
              <th className="px-3 py-2 border">Price/Month</th>
              <th className="px-3 py-2 border">Station Name</th>
              <th className="px-3 py-2 border">Company</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEbikes.map((bike) => (
              <tr key={bike.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border font-medium">{mapModel[bike.modelId] || '-'}</td>
                <td className="px-3 py-2 border">{bike.serialNumber}</td>
                <td className="px-3 py-2 border">{bike.vehicleID}</td>
                <td className="px-3 py-2 border">
                  {bike.id && (
                    <div className="w-16 h-16">
                      <QRCode value={bike.id} size={64} />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 border">{bike.plateNumber}</td>
                <td className="px-3 py-2 border">{bike.color || '-'}</td>
                <td className="px-3 py-2 border">{bike.odo} km</td>
                <td className="px-3 py-2 border">{bike.batteryCapacity}</td>
                <td className="px-3 py-2 border">{bike.range} km</td>
                <td className="px-3 py-2 border">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    bike.status === 'Available'
                      ? 'bg-green-100 text-green-800'
                      : bike.status === 'Reserved'
                      ? 'bg-blue-100 text-blue-800'
                      : bike.status === 'In Use'
                      ? 'bg-orange-100 text-orange-800'
                      : bike.status === 'Under Maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : bike.status === 'Broken'
                      ? 'bg-red-100 text-red-800'
                      : bike.status === 'Sold'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {bike.status}
                  </span>
                </td>
                <td className="px-3 py-2 border">{bike.currentLocation}</td>
                <td className="px-3 py-2 border">{bike.note || '-'}</td>
                <td>{bike.pricePerHour !== undefined ? formatCurrency(bike.pricePerHour) : '-'}</td>
                <td className="px-3 py-2 border">{formatCurrency(bike.pricePerDay)}</td>
                <td>{bike.pricePerWeek !== undefined ? formatCurrency(bike.pricePerWeek) : '-'}</td>
                <td>{bike.pricePerMonth !== undefined ? formatCurrency(bike.pricePerMonth) : '-'}</td>
                <td className="px-3 py-2 border">{mapStation[bike.stationId] || '-'}</td>
                <td className="px-3 py-2 border">{companyMap[bike.companyId] || 'Unknown'}</td>
                <td className="px-3 py-2 border flex gap-1">
                  <Button size="sm" onClick={() => onEdit(bike)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteConfirm(bike)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-4">
        {sortedEbikes.map((bike) => (
          <div key={bike.id} className="bg-gray-50 rounded-lg shadow p-4">
            <h3 className="text-base font-bold">{mapModel[bike.modelId] || '-'}</h3>
            <p className="text-sm text-gray-600">Serial: {bike.serialNumber}</p>
            <p className="text-sm text-gray-600">Plate: {bike.plateNumber}</p>
            <p className="text-sm text-gray-600">ODO: {bike.odo} km</p>
            <p className="text-sm text-gray-600">Battery: {bike.batteryCapacity}</p>
            <p className="text-sm text-gray-600">Range: {bike.range} km</p>
            <p className="text-sm text-gray-600">Status: {bike.status}</p>
            {bike.id && (
              <div className="mt-2">
                <QRCode value={bike.id} size={64} />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => onEdit(bike)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => onDeleteConfirm(bike)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
