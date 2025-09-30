// functions/src/notifications/http/enqueueNotificationJob.ts
import * as functions from "firebase-functions";
import { db, FieldValue } from "../../utils/db.js";

type Channel = "inapp" | "push" | "zalo" | "viber" | "email" | "sms";

type Input = {
  templateId: string;
  audience: { type: "user"; uid: string };
  data?: Record<string, any>;
  requiredChannels?: Channel[];
  topic?: string;
};

export const enqueueNotificationJob = functions
  .region("asia-southeast1")
  .https.onCall(async (data: Input, ctx) => {
    // Auth required; only allow enqueue for yourself
    if (!ctx.auth?.uid) {
      throw new functions.https.HttpsError("unauthenticated", "Auth required");
    }
    if (data?.audience?.type !== "user" || data.audience.uid !== ctx.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only enqueue jobs for yourself"
      );
    }
    if (!data?.templateId) {
      throw new functions.https.HttpsError("invalid-argument", "templateId is required");
    }

    const ref = await db.collection("notificationJobs").add({
      templateId: String(data.templateId),
      audience: { type: "user", uid: ctx.auth.uid },
      data: data.data ?? {},
      requiredChannels: data.requiredChannels ?? null,
      topic: data.topic ?? null,
      status: "queued",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, id: ref.id };
  });
