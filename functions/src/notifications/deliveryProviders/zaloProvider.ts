// functions/src/notifications/deliveryProviders/zaloProvider.ts
import type { ProviderContext, ProviderResult, SendPayload } from "./types.js";
import { readStore, writeStore } from "../zalo/tokenStore.js";
import { refreshZaloViaOAuth } from "../zalo/refresh.js";

export interface ZaloTarget { zaloUserId: string; phone?: string }

export async function sendZalo(
  target: ZaloTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  // 1) Emulator: giả lập thành công
  const isEmu = process.env.FUNCTIONS_EMULATOR === "true" || !!process.env.FIREBASE_EMULATOR_HUB;
  if (isEmu) return { provider: "zalo", status: "sent", providerMessageId: `emul_${Date.now()}` };

  // 2) Validate target
  if (!target?.zaloUserId) {
    return { provider: "zalo", status: "skipped", errorCode: "BAD_TARGET", errorMessage: "Missing zaloUserId" };
  }

  // 3) Lấy token từ Firestore (ưu tiên), fallback Secret ENV
  const store = await readStore();                 // phải dùng path doc: "zalo_oa/config"
  let token = (store?.access_token || process.env.ZALO_OA_TOKEN || "").trim();
  if (!token) {
    return { provider: "zalo", status: "failed", errorCode: "NO_TOKEN", errorMessage: "No OA token" };
  }

  const text = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()]
    .filter(Boolean)
    .join("\n");

  async function callWith(tok: string) {
    const res = await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
      method: "POST",
      headers: {
        "access_token": tok,            // ✅ DÙNG tham số 'tok', KHÔNG dùng biến ngoài
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { user_id: target.zaloUserId },
        message:   { text },
        tracking_id: ctx.jobId,
      }),
    });

    const json: any = await res.json().catch(() => ({}));
    // Zalo trả error = 0 khi OK, error = -216 khi token invalid
    const code = (typeof json?.error === "number")
      ? json.error
      : (json?.error?.code ?? json?.error_code ?? json?.code);

    // ok khi HTTP OK và không có error, hoặc error === 0
    const ok = res.ok && (code === undefined || code === 0);
    return { ok, json, code };
  }

  // 4) Gọi lần 1
  let { ok, json, code } = await callWith(token);

  // 5) Nếu token invalid (-216) → refresh & retry 1 lần
  if (code === -216) {
    try {
      token = await refreshZaloViaOAuth();           // bạn đã có hàm này
      await writeStore({ access_token: token, refreshed_at: Date.now() });
      ({ ok, json, code } = await callWith(token));
    } catch (e: any) {
      return { provider: "zalo", status: "failed", errorCode: "REFRESH_FAIL", errorMessage: e?.message || String(e) };
    }
  }

  // 6) Nếu vẫn fail → trả lỗi
  if (!ok) {
    const errMsg = json?.message || JSON.stringify(json).slice(0, 200);
    return { provider: "zalo", status: "failed", errorCode: String(code ?? "HTTP"), errorMessage: errMsg, meta: json };
  }

  // 7) Thành công
  const pmid = json?.data?.message_id ?? json?.message_id;
  return { provider: "zalo", status: "sent", providerMessageId: pmid ? String(pmid) : undefined, meta: json };
}
