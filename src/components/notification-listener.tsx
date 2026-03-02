"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { NotificationToastContainer } from "./notification-toast";

interface PollNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    vehicle: string;
    createdAt: string;
}

// ── Web Audio API alarm sounds ──
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
            // Regular alert: pleasant double-beep
            for (let i = 0; i < 2; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.value = 800;
                gain.gain.value = 0.1;

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
function showBrowserNotification(notification: PollNotification) {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: `${notification.vehicle} — ${notification.body}`,
            icon: "/favicon.ico",
            tag: notification.id, // Prevents duplicates
            requireInteraction: notification.type === "EMERGENCY",
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

export function NotificationListener() {
    const [toasts, setToasts] = useState<PollNotification[]>([]);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const initialLoadRef = useRef(true);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const poll = async () => {
            try {
                const res = await fetch("/api/notifications/poll", {
                    cache: "no-store",
                });
                if (!res.ok) return;

                const data: { unreadCount: number; notifications: PollNotification[] } =
                    await res.json();

                // On initial load, just record existing IDs without alerting
                if (initialLoadRef.current) {
                    initialLoadRef.current = false;
                    data.notifications.forEach((n) => seenIdsRef.current.add(n.id));

                    // Update badge
                    updateBadge(data.unreadCount);
                    return;
                }

                // Find genuinely new notifications
                const newOnes = data.notifications.filter(
                    (n) => !seenIdsRef.current.has(n.id)
                );

                if (newOnes.length > 0) {
                    newOnes.forEach((n) => {
                        seenIdsRef.current.add(n.id);

                        // Play sound
                        playAlertSound(n.type);

                        // Browser notification
                        showBrowserNotification(n);
                    });

                    // Show toasts (max 3 at once)
                    setToasts((prev) => [...newOnes, ...prev].slice(0, 3));
                }

                // Update badge
                updateBadge(data.unreadCount);
            } catch {
                // Network error — silently retry next cycle
            }
        };

        // Poll immediately, then every 5 seconds
        poll();
        const interval = setInterval(poll, 5000);

        return () => clearInterval(interval);
    }, []);

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
