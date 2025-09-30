import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase-client";
import { getFunctions, httpsCallable } from "firebase/functions";

export type NotifyInput = {
  templateId: string;
  audience: { type: "user"; uid: string };
  data?: Record<string, any>;
  requiredChannels?: Array<"inapp" | "push" | "zalo" | "viber" | "email" | "sms">;
  topic?: string;
};

const REGION = "asia-southeast1";

export async function enqueueNotification(input: NotifyInput) {
  // 1) Try callable (preferred)
  try {
    const fns = getFunctions(undefined, REGION);
    const call = httpsCallable(fns, "enqueueNotificationJob");
    const res = await call(input);
    return res.data;
  } catch (err: any) {
    // If function missing/wrong region/etc. fall back to Firestore create
    // (only works if your rules allow create for the signed-in user)
    if (typeof window !== "undefined") {
      console.warn("Callable failed, fallback to Firestore:", err);
    }
    return addDoc(collection(db, "notificationJobs"), {
      ...input,
      status: "queued",
      createdAt: serverTimestamp(),
    });
  }
}
