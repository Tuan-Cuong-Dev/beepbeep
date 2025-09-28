import { db } from "../../utils/db.js";
const DOC_PATH = "zalo_oa/config"; // ✔ 2 segment: collection/doc
export async function readStore() {
    const snap = await db.doc(DOC_PATH).get();
    return snap.exists ? snap.data() : {};
}
export async function writeStore(patch) {
    await db.doc(DOC_PATH).set(patch, { merge: true });
}
//# sourceMappingURL=tokenStore.js.map