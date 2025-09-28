import { readStore, writeStore } from "./tokenStore.js";

export async function refreshZaloViaOAuth(): Promise<string> {
  const appId = (process.env.ZALO_APP_ID || "").trim();
  const appSecret = (process.env.ZALO_APP_SECRET || "").trim();
  if (!appId || !appSecret) throw new Error("ZALO_APP_ID/SECRET not set");

  const { refresh_token } = await readStore();
  if (!refresh_token) throw new Error("No refresh_token in store");

  const body = new URLSearchParams();
  body.set("app_id", appId);
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refresh_token);

  const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
    method: "POST",
    headers: { "secret_key": appSecret, "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json?.access_token) {
    throw new Error(`refresh failed: ${json?.error_name || res.status}`);
  }
  await writeStore({
    access_token: json.access_token,
    refresh_token: json.refresh_token || refresh_token,
    // expires_in (sec) -> expires_at (ms) if provided
    ...(json.expires_in ? { expires_at: Date.now() + Number(json.expires_in) * 1000 } : {})
  });
  return json.access_token as string;
}
