// src/lib/notifications/deliveryProviders/fcmProvider.ts
import * as admin from 'firebase-admin';
export async function sendFcm(target, payload, ctx) {
    try {
        const baseData = {
            actionUrl: payload.actionUrl ?? '',
            jobId: String(ctx.jobId ?? ''),
            uid: String(ctx.uid ?? ''),
        };
        const baseAndroid = {
            priority: 'high',
            notification: { sound: 'default' },
        };
        const baseApns = {
            payload: {
                aps: {
                    sound: 'default',
                    'thread-id': String(ctx.jobId ?? ''),
                },
            },
        };
        // 1) Multicast
        const tokens = (target.tokens || []).filter(Boolean);
        if (tokens.length > 0) {
            const multi = {
                tokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: baseData,
                android: baseAndroid,
                apns: baseApns,
            };
            const res = await admin.messaging().sendEachForMulticast(multi);
            const okCount = res.responses.filter(r => r.success).length;
            const firstOk = res.responses.find(r => r.success)?.messageId;
            const firstErr = res.responses.find(r => !r.success)?.error;
            return {
                provider: 'fcm',
                status: okCount > 0 ? 'sent' : 'failed',
                providerMessageId: firstOk,
                errorCode: firstErr?.code,
                errorMessage: firstErr?.message,
                meta: { successCount: okCount, failureCount: res.failureCount },
            };
        }
        // 2) Topic
        if (target.topic) {
            const msg = {
                topic: target.topic,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: baseData,
                android: baseAndroid,
                apns: baseApns,
            };
            const id = await admin.messaging().send(msg);
            return { provider: 'fcm', status: 'sent', providerMessageId: id };
        }
        // 3) Single token
        if (target.token) {
            const msg = {
                token: target.token, // token chắc chắn là string ở đây
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: baseData,
                android: baseAndroid,
                apns: baseApns,
            };
            const id = await admin.messaging().send(msg);
            return { provider: 'fcm', status: 'sent', providerMessageId: id };
        }
        // 4) Không có target hợp lệ
        return {
            provider: 'fcm',
            status: 'skipped',
            errorMessage: 'No FCM target (tokens/topic/token) provided',
        };
    }
    catch (e) {
        return {
            provider: 'fcm',
            status: 'failed',
            errorCode: e?.code,
            errorMessage: e?.message || String(e),
        };
    }
}
