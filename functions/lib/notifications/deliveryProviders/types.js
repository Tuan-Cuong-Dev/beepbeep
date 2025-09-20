// functions/src/notifications/deliveryProviders/types.ts
export const COLLECTIONS = {
    jobs: 'notificationJobs',
    deliveries: 'deliveries',
    userNotifications: 'user_notifications',
    userNotificationPreferences: 'userNotificationPreferences',
};
export function makeDeliveryId(jobId, channel, key) {
    return `${jobId}_${channel}_${key || 'unknown'}`;
}
