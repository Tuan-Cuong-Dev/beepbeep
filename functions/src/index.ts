// functions/src/index.ts
import './utils/db.js'; // chỉ để đảm bảo đã init, không cần dùng gì từ đây

// export các functions (NHỚ .js ở cuối vì NodeNext/ESM)
export { onNotificationJobCreate } from './notifications/orchestrator.js';

export { zaloWebhook } from './notifications/webhooks/zaloWebhook.js';
export { viberWebhook } from './notifications/webhooks/viberWebhook.js';

export { sendInapp } from './notifications/channelWorkers/sendInapp.js';
export { sendFcm } from './notifications/channelWorkers/sendFcm.js';
export { sendZalo } from './notifications/channelWorkers/sendZalo.js';
export { sendViber } from './notifications/channelWorkers/sendViber.js';
export { sendEmail } from './notifications/channelWorkers/sendEmail.js';
export { sendSms } from './notifications/channelWorkers/sendSms.js';
