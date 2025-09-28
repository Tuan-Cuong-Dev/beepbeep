import { db } from "../../utils/db.js";

const DOC_PATH = "zalo_oa/config"; // ✔ 2 segment: collection/doc

export async function readStore() {
  const snap = await db.doc(DOC_PATH).get();
  return snap.exists ? (snap.data() as Record<string, any>) : {};
}

export async function writeStore(patch: Record<string, any>) {
  await db.doc(DOC_PATH).set(patch, { merge: true });
}
