import * as XLSX from 'xlsx';
import { Ebike } from './ebikeTypes';
import { VehicleModel } from '../vehicle-models/vehicleModelTypes';
import { Timestamp, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface EbikeExcelImport {
  modelName: string;
  serialNumber: string;
  vehicleID: string;
  qrCodeUrl: string;
  plateNumber: string;
  odo?: number;
  color?: string;
  status?: string;
  currentLocation?: string;
  lastMaintained?: string;
  batteryCapacity?: number;
  range?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  stationName?: string;
  companyName?: string;
}

export const importvehicles = async (
  file: File,
  models: VehicleModel[],
  onFinish: (newvehicles: Ebike[]) => void,
  companyId: string,
  stationMap: Record<string, string>
) => {
  const reader = new FileReader();

  reader.onload = async (evt) => {
    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const imported = XLSX.utils.sheet_to_json<EbikeExcelImport>(sheet);

    for (const item of imported) {
      const model = models.find((m) => m.name === item.modelName);
      if (!model) {
        alert(`❌ Không tìm thấy Model: ${item.modelName}. Vui lòng kiểm tra lại!`);
        return;
      }

      const stationId = Object.keys(stationMap).find(
        (key) => stationMap[key] === item.stationName
      );

      await addDoc(collection(db, 'vehicles'), {
        modelId: model.id,
        serialNumber: item.serialNumber || '',
        vehicleID: item.vehicleID || '',
        qrCodeUrl: item.qrCodeUrl || '',
        plateNumber: item.plateNumber || '',
        odo: item.odo || 0,
        color: item.color || 'Unknown',
        status: item.status || 'Unknown',
        currentLocation: item.currentLocation || 'Unknown',
        lastMaintained: item.lastMaintained || '',
        batteryCapacity: item.batteryCapacity || 0,
        range: item.range || 0,
        pricePerHour: item.pricePerHour ?? undefined,
        pricePerDay: item.pricePerDay || 0,
        pricePerWeek: item.pricePerWeek ?? undefined,
        pricePerMonth: item.pricePerMonth ?? undefined,
        stationId: stationId || '',
        companyId,
      });
    }

    const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
    const vehiclesList = vehiclesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Ebike, 'id'>),
    }));

    onFinish(vehiclesList);
  };

  reader.readAsArrayBuffer(file);
};
