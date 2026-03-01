import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Shield, ArrowLeft, BellOff, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/tags";

// Void wrappers for form action compatibility (form actions must return void)
async function markAllReadAction(): Promise<void> {
    "use server";
    await markAllNotificationsRead();
}

// Next.js .bind pattern: bound arg is prepended before FormData
async function markReadAction(id: string, _fd: FormData): Promise<void> {
    "use server";
    await markNotificationRead(id);
}


const typeColors: Record<string, string> = {
    EMERGENCY: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    SMS_RECEIVED: "bg-primary/10 text-primary border-primary/20",
    CALL_RECEIVED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    TOW_ALERT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

const typeLabel: Record<string, string> = {
    EMERGENCY: "Emergency",
    SMS_RECEIVED: "Message",
    CALL_RECEIVED: "Call",
    TOW_ALERT: "Tow Alert",
};

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            interaction: {
                include: {
                    tag: {
                        include: {
                            vehicle: { select: { model: true, color: true } },
                        },
                    },
                },
            },
        },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                    <Link href="/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Separator orientation="vertical" className="h-5" />
                    <Link href="/" className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">ReachMasked</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                        <p className="text-muted-foreground mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <form action={markAllReadAction}>
                            <Button variant="outline" size="sm" className="gap-2 border-border">
                                <CheckCheck className="h-4 w-4" />
                                Mark all read
                            </Button>
                        </form>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <Card className="border-border bg-card">
                        <CardContent className="py-16 text-center">
                            <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-1">No notifications yet</h3>
                            <p className="text-muted-foreground text-sm">
                                When someone scans your tag and contacts you, it will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => {
                            const vehicle = notif.interaction?.tag?.vehicle;
                            const vehicleLabel = vehicle
                                ? `${vehicle.color} ${vehicle.model}`
                                : "Unknown vehicle";

                            return (
                                <div
                                    key={notif.id}
                                    className={`relative rounded-xl border p-4 transition-colors ${notif.isRead
                                        ? "border-border bg-card"
                                        : "border-primary/20 bg-primary/5"
                                        }`}
                                >
                                    {!notif.isRead && (
                                        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                    <div className="flex items-start gap-3">
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-xs font-medium ${typeColors[notif.type] ?? "bg-muted text-muted-foreground"}`}
                                        >
                                            {typeLabel[notif.type] ?? notif.type}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-muted-foreground">{vehicleLabel}</span>
                                                <span className="text-xs text-muted-foreground">·</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {!notif.isRead && (
                                        <div className="mt-3 flex justify-end">
                                            <form action={markReadAction.bind(null, notif.id)}>
                                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                                                    Mark as read
                                                </Button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
