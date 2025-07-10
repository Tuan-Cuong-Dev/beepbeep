// src/lib/ebikes/exportEbikes.ts

import * as XLSX from 'xlsx';
import { Ebike } from './ebikeTypes';
import { EbikeModel } from '../vehicleModels/ebikeModelTypes';
import { RentalStation } from '../rentalStations/rentalStationTypes';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface ExportEbikeOptions {
  ebikes: Ebike[];
  models: EbikeModel[];
  stations: RentalStation[];
  companyId: string;
}

export const exportEbikesToExcel = async ({ ebikes, models, stations, companyId }: ExportEbikeOptions) => {
  const modelMap: Record<string, string> = {};
  const stationMap: Record<string, string> = {};
  let companyName = 'Unknown Company';

  models?.forEach((m) => {
    modelMap[m.id] = m.name;
  });

  stations?.forEach((s) => {
    stationMap[s.id] = s.name;
  });

  try {
    const companySnap = await getDoc(doc(db, 'rentalCompanies', companyId));
    if (companySnap.exists()) {
      companyName = companySnap.data().name || companyName;
    }
  } catch (err) {
    console.error('❌ Error fetching company name in export:', err);
  }

  const exportData = ebikes.map((e) => ({
    id: e.id || '',
    modelName: modelMap[e.modelId] || 'Unknown Model',
    serialNumber: e.serialNumber || '',
    vehicleID: e.vehicleID || '',
    plateNumber: e.plateNumber || '',
    odo: e.odo ?? '',
    color: e.color || '',
    status: e.status || '',
    currentLocation: e.currentLocation || '',
    lastMaintained: e.lastMaintained instanceof Object
      ? e.lastMaintained.toDate().toISOString()
      : '',
    batteryCapacity: e.batteryCapacity ?? '',
    range: e.range ?? '',
    pricePerHour: e.pricePerHour ?? '',
    pricePerDay: e.pricePerDay ?? '',
    pricePerWeek: e.pricePerWeek ?? '',
    pricePerMonth: e.pricePerMonth ?? '',
    stationName: stationMap[e.stationId] || 'Unknown Station',
    companyName: companyName || 'Unknown Company',
    createdAt: e.createdAt instanceof Object
      ? e.createdAt.toDate().toISOString()
      : '',
    updatedAt: e.updatedAt instanceof Object
      ? e.updatedAt.toDate().toISOString()
      : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ebikes');
  XLSX.writeFile(workbook, 'ebikes_export.xlsx');
};