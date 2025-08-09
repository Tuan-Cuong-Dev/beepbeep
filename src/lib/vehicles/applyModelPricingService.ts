// 📄 lib/ebikes/applyModelPricingService.ts

import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";

export async function applyPricingFromModelsToVehicles(companyId: string) {
  try {
    const modelQuery = query(collection(db, "ebikeModels"), where("companyId", "==", companyId));
    const modelSnapshot = await getDocs(modelQuery);

    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const modelDoc of modelSnapshot.docs) {
      const modelData = modelDoc.data();
      const modelId = modelDoc.id;

      const {
        pricePerHour = 0,
        pricePerDay = 0,
        pricePerWeek = 0,
        pricePerMonth = 0,
      } = modelData;

      const ebikeQuery = query(
        collection(db, "ebikes"),
        where("modelId", "==", modelId),
        where("companyId", "==", companyId)
      );
      const ebikeSnapshot = await getDocs(ebikeQuery);

      for (const ebikeDoc of ebikeSnapshot.docs) {
        const ebikeRef = ebikeDoc.ref;
        batch.update(ebikeRef, {
          pricePerHour,
          pricePerDay,
          pricePerWeek,
          pricePerMonth,
        });
        updatedCount++;
      }
    }

    await batch.commit();
    console.log(`✅ Applied pricing to ${updatedCount} vehicles.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("❌ Error applying pricing from models:", error);
    return { success: false, error };
  }
}
