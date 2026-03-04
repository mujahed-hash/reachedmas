/**
 * In-memory notification event bus.
 * When contact.ts creates a notification, it emits an event here.
 * The SSE endpoint subscribes to these events per-user and pushes them to the client.
 */

import { EventEmitter } from "events";

export interface NotificationEvent {
    id: string;
    type: string;
    title: string;
    body: string;
    asset: string;
    tagCode: string;
    createdAt: string;
}

// Singleton — survives across requests in the same Node process
const globalForEmitter = globalThis as unknown as {
    notificationEmitter?: EventEmitter;
};

if (!globalForEmitter.notificationEmitter) {
    globalForEmitter.notificationEmitter = new EventEmitter();
    globalForEmitter.notificationEmitter.setMaxListeners(200); // support many connected users
}

export const notificationEmitter = globalForEmitter.notificationEmitter;

/**
 * Emit a notification event for a specific user.
 * Call this from contact.ts after creating a notification in the DB.
 */
export function emitNotification(userId: string, notification: NotificationEvent) {
    notificationEmitter.emit(`notification:${userId}`, notification);
}
