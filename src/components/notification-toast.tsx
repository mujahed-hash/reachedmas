"use client";

import { useEffect, useState } from "react";
import { X, Bell, AlertTriangle, Truck, Phone, MessageSquare } from "lucide-react";
import Link from "next/link";

interface NotificationToastData {
    id: string;
    type: string;
    title: string;
    body: string;
    vehicle: string;
}

interface NotificationToastProps {
    notification: NotificationToastData;
    onDismiss: (id: string) => void;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; glow: string }> = {
    EMERGENCY: {
        icon: <Phone className="h-5 w-5" />,
        color: "border-red-500/40 bg-red-500/10",
        glow: "shadow-red-500/20 shadow-lg",
    },
    TOW_ALERT: {
        icon: <Truck className="h-5 w-5" />,
        color: "border-amber-500/40 bg-amber-500/10",
        glow: "shadow-amber-500/20 shadow-lg",
    },
    SMS_RECEIVED: {
        icon: <MessageSquare className="h-5 w-5" />,
        color: "border-blue-500/40 bg-blue-500/10",
        glow: "shadow-blue-500/20 shadow-lg",
    },
    CALL_RECEIVED: {
        icon: <Phone className="h-5 w-5" />,
        color: "border-indigo-500/40 bg-indigo-500/10",
        glow: "shadow-indigo-500/20 shadow-lg",
    },
};

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    const config = typeConfig[notification.type] ?? {
        icon: <Bell className="h-5 w-5" />,
        color: "border-primary/40 bg-primary/10",
        glow: "shadow-primary/20 shadow-lg",
    };

    useEffect(() => {
        // Enter animation
        requestAnimationFrame(() => setVisible(true));

        // Auto-dismiss after 10 seconds
        const timer = setTimeout(() => dismiss(), 10000);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
    };

    return (
        <div
            className={`
                relative w-80 rounded-xl border p-4 backdrop-blur-xl
                transition-all duration-300 ease-out
                ${config.color} ${config.glow}
                ${visible && !exiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
            `}
        >
            {/* Dismiss button */}
            <button
                onClick={dismiss}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
            >
                <X className="h-3.5 w-3.5" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 pr-4">
                <div className="mt-0.5 shrink-0">{config.icon}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.body}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                            {notification.vehicle}
                        </span>
                        <Link
                            href="/notifications"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={dismiss}
                        >
                            View →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
                <div
                    className="h-full bg-current opacity-30 animate-shrink-width"
                    style={{ animationDuration: "10s" }}
                />
            </div>
        </div>
    );
}

export function NotificationToastContainer({ toasts, onDismiss }: {
    toasts: NotificationToastData[];
    onDismiss: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
            {toasts.map((toast) => (
                <NotificationToast
                    key={toast.id}
                    notification={toast}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
}
