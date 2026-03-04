"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { NotificationToastContainer } from "./notification-toast";

interface SSENotification {
    id: string;
    type: string;
    title: string;
    body: string;
    asset: string;
    tagCode: string;
    createdAt: string;
}

// ── Web Audio API alert sounds ──
function playAlertSound(type: string) {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        if (type === "EMERGENCY" || type === "TOW_ALERT") {
            // Urgent siren: alternating tones
            for (let i = 0; i < 6; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sawtooth";
                osc.frequency.value = i % 2 === 0 ? 880 : 660;
                gain.gain.value = 0.15;

                const start = ctx.currentTime + i * 0.2;
                osc.start(start);
                osc.stop(start + 0.18);
            }
        } else {
            // Regular alert: pleasant triple-beep (more noticeable)
            for (let i = 0; i < 3; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.value = 800;
                gain.gain.value = 0.12;

                const start = ctx.currentTime + i * 0.15;
                osc.start(start);
                osc.stop(start + 0.1);
            }
        }
    } catch {
        // Audio not available — silently skip
    }
}

// ── Browser Notification API ──
function showBrowserNotification(notification: SSENotification) {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: `${notification.asset} — ${notification.body}`,
            icon: "/favicon.ico",
            tag: notification.id,
            requireInteraction: notification.type === "EMERGENCY",
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

export function NotificationListener() {
    const [toasts, setToasts] = useState<SSENotification[]>([]);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const initialLoadRef = useRef(true);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const connectSSE = useCallback(() => {
        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const es = new EventSource("/api/notifications/stream");
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Initial load: batch of existing notifications
                if (data.type === "initial") {
                    if (initialLoadRef.current) {
                        initialLoadRef.current = false;
                        data.notifications?.forEach((n: SSENotification) =>
                            seenIdsRef.current.add(n.id)
                        );
                        updateBadge(data.unreadCount || 0);
                    }
                    return;
                }

                // Single real-time notification
                const notification = data as SSENotification;
                if (seenIdsRef.current.has(notification.id)) return;

                seenIdsRef.current.add(notification.id);

                // 🔊 Play sound on EVERY notification
                playAlertSound(notification.type);

                // 📢 Browser notification
                showBrowserNotification(notification);

                // Show toast (max 3 at once)
                setToasts((prev) => [notification, ...prev].slice(0, 3));

                // Update badge count
                const currentBadge = document.getElementById("notification-badge");
                const currentCount = parseInt(currentBadge?.textContent || "0", 10);
                updateBadge(currentCount + 1);
            } catch {
                // Invalid JSON — skip
            }
        };

        es.onerror = () => {
            es.close();
            eventSourceRef.current = null;

            // Reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connectSSE();
            }, 3000);
        };
    }, []);

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        connectSSE();

        return () => {
            eventSourceRef.current?.close();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connectSSE]);

    return (
        <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />
    );
}

// ── Update the notification bell badge in the DOM ──
function updateBadge(count: number) {
    const badge = document.getElementById("notification-badge");
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 9 ? "9+" : String(count);
        badge.classList.remove("hidden");
        badge.classList.add("animate-pulse");
    } else {
        badge.classList.add("hidden");
        badge.classList.remove("animate-pulse");
    }
}
