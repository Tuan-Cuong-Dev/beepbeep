import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

// 🚲 Types for Ebike and Battery status
export type EbikeStatus = 'Available' | 'In Use' | 'Under Maintenance' |'Reserved' | 'Sold' |'Broken';
export type BatteryStatus = 'in_stock' | 'in_use' | 'returned';

/**
 * Update ebike status by VIN (vehicleID).
 * 
 * @param vin - VIN (vehicleID) of the ebike
 * @param status - New status for ebike
 */
export async function updateEbikeStatusByVIN(vin: string, status: EbikeStatus) {
  try {
    const ebikeQuery = query(collection(db, 'ebikes'), where('vehicleID', '==', vin));
    const ebikeSnap = await getDocs(ebikeQuery);

    if (!ebikeSnap.empty) {
      const ebikeDoc = ebikeSnap.docs[0];
      await updateDoc(ebikeDoc.ref, { status });
      console.log(`✅ Ebike VIN ${vin} updated to ${status}`);
    } else {
      console.warn(`⚠️ Ebike with VIN ${vin} not found!`);
    }
  } catch (err) {
    console.error('❌ Error updating ebike status:', err);
  }
}

/**
 * Update battery status by batteryCode.
 * 
 * @param batteryCode - Battery code
 * @param status - New status for battery
 */
export async function updateBatteryStatusByCode(batteryCode: string, status: BatteryStatus) {
  try {
    const batteryQuery = query(collection(db, 'batteries'), where('batteryCode', '==', batteryCode));
    const batterySnap = await getDocs(batteryQuery);

    if (!batterySnap.empty) {
      const batteryDoc = batterySnap.docs[0];
      await updateDoc(batteryDoc.ref, { status });
      console.log(`✅ Battery ${batteryCode} updated to ${status}`);
    } else {
      console.warn(`⚠️ Battery ${batteryCode} not found!`);
    }
  } catch (err) {
    console.error('❌ Error updating battery status:', err);
  }
}

/**
 * Update both ebike and battery status.
 * 
 * @param vin - VIN of the ebike
 * @param ebikeStatus - Ebike status
 * @param batteryCode - Battery code
 * @param batteryStatus - Battery status
 */
export async function updateEbikeAndBatteryStatusByVIN(
  vin: string,
  ebikeStatus: EbikeStatus,
  batteryCode: string,
  batteryStatus: BatteryStatus
) {
  await updateEbikeStatusByVIN(vin, ebikeStatus);
  await updateBatteryStatusByCode(batteryCode, batteryStatus);
}
