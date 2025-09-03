import { Timestamp, FieldValue } from "firebase/firestore";
import { LocationCore } from "@/src/lib/locations/locationTypes";

export interface PrivateProvider {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  phone: string;

  displayAddress: string;
  location: LocationCore;

  businessType: "private_provider";
  createdAt: Timestamp | FieldValue;   // 👈 cho phép FieldValue
  updatedAt?: Timestamp | FieldValue;  // 👈 cho phép FieldValue
}
