// functions/src/notifications/cron/refreshZalo.ts
// 1) Cron tự làm mới token (nếu bạn chưa bật)
// Lý tưởng: refresh trước khi hết hạn ~5–10 phút và khi gặp -216.
// Đặt secret ZALO_APP_ID, ZALO_APP_SECRET đã xong; chỉ cần function lịch:
import * as functions from 'firebase-functions';
import { readStore, writeStore } from '../zalo/tokenStore.js';
import { refreshZaloViaOAuth } from '../zalo/refresh.js';
export const refreshZaloToken = functions
    .runWith({ secrets: ['ZALO_APP_ID', 'ZALO_APP_SECRET'] })
    .region('asia-southeast1')
    .pubsub.schedule('every 45 minutes')
    .timeZone('Asia/Ho_Chi_Minh')
    .onRun(async () => {
    const s = await readStore(); // { access_token, refresh_token, expires_at? }
    if (!s?.refresh_token)
        return;
    const soon = Date.now() + 10 * 60 * 1000; // 10'
    if (!s.expires_at || s.expires_at < soon) {
        const newToken = await refreshZaloViaOAuth(); // bạn đã có
        await writeStore({ access_token: newToken, updated_at: Date.now() });
    }
});
//# sourceMappingURL=refreshZalo.js.map