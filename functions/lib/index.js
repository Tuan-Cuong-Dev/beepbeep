// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app';
initializeApp();
// export các function như cũ...
export { onNotificationJobCreate } from './notifications/orchestrator.js';
export { zaloWebhook } from './notifications/webhooks/zaloWebhook.js';
export { viberWebhook } from './notifications/webhooks/viberWebhook.js';
export { sendInapp } from './notifications/channelWorkers/sendInapp.js';
export { sendFcm } from './notifications/channelWorkers/sendFcm.js';
export { sendZalo } from './notifications/channelWorkers/sendZalo.js';
export { sendViber } from './notifications/channelWorkers/sendViber.js';
export { sendEmail } from './notifications/channelWorkers/sendEmail.js';
export { sendSms } from './notifications/channelWorkers/sendSms.js';
