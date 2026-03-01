import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Car, MessageSquare, Phone, Truck, AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanHeatmap } from "@/components/scan-heatmap";
import { Header } from "@/components/header";
import { type AutoReply } from "@prisma/client";

const actionIcon: Record<string, React.ReactNode> = {
    SCAN_VIEW: <Eye className="h-4 w-4" />,
    CONTACT_SMS: <MessageSquare className="h-4 w-4" />,
    CONTACT_CALL: <Phone className="h-4 w-4" />,
    TOW_ALERT: <Truck className="h-4 w-4" />,
    EMERGENCY: <AlertTriangle className="h-4 w-4" />,
};

const actionLabel: Record<string, string> = {
    SCAN_VIEW: "Tag Scanned",
    CONTACT_SMS: "Message Sent",
    CONTACT_CALL: "Call Initiated",
    TOW_ALERT: "Tow Alert",
    EMERGENCY: "Emergency",
};

const actionColor: Record<string, string> = {
    SCAN_VIEW: "bg-muted text-muted-foreground",
    CONTACT_SMS: "bg-primary/10 text-primary border-primary/20",
    CONTACT_CALL: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    TOW_ALERT: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    EMERGENCY: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default async function VehicleHistoryPage({
    params,
}: {
    params: Promise<{ vehicleId: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { vehicleId } = await params;

    const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, ownerId: session.user.id }
    });

    if (!vehicle) redirect("/dashboard");

    const tags = await prisma.tag.findMany({
        where: { vehicleId: vehicle.id }
    });

    const autoReplies = await prisma.autoReply.findMany({
        where: { vehicleId: vehicle.id },
        orderBy: { createdAt: "desc" }
    });

    const tagIds = tags.map((t) => t.id);

    // Get all interactions for this vehicle's tags
    const interactions = await prisma.interaction.findMany({
        where: { tagId: { in: tagIds } },
        orderBy: { timestamp: "desc" },
        take: 100,
        include: {
            tag: { select: { shortCode: true } },
        },
    });

    const vehicleName = `${vehicle.color} ${vehicle.model}`;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header variant="dashboard" session={session} />

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Vehicle Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{vehicleName}</h1>
                        <p className="text-muted-foreground text-sm">
                            {tags.length} tag{tags.length !== 1 ? "s" : ""} ·{" "}
                            {interactions.length} interaction{interactions.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Auto-Replies Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-3">Auto-Replies</h2>
                    {autoReplies.length === 0 ? (
                        <Card className="border-border bg-card">
                            <CardContent className="py-6 text-center">
                                <p className="text-muted-foreground text-sm">
                                    No auto-replies set. When you add one, scanners will see it after
                                    contacting you.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {autoReplies.map((reply: AutoReply) => (
                                <div
                                    key={reply.id}
                                    className={`rounded-lg border p-3 ${reply.isActive
                                        ? "border-primary/20 bg-primary/5"
                                        : "border-border bg-card opacity-60"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-foreground">
                                            {reply.label}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                reply.isActive
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                                                    : "text-xs"
                                            }
                                        >
                                            {reply.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">
                                        &ldquo;{reply.message}&rdquo;
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Interaction Timeline & Heatmap */}
                <div className="mb-8">
                    {interactions.length > 0 && (
                        <div className="mb-6">
                            <ScanHeatmap interactions={interactions.map(i => ({ timestamp: i.timestamp, actionType: i.actionType }))} />
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                        Contact History
                    </h2>
                    {interactions.length === 0 ? (
                        <Card className="border-border bg-card">
                            <CardContent className="py-10 text-center">
                                <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">
                                    No interactions yet. Share your tag to start receiving contacts!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {interactions.map((interaction) => (
                                <div
                                    key={interaction.id}
                                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                                >
                                    <div
                                        className={`p-2 rounded-lg shrink-0 ${actionColor[interaction.actionType] ?? "bg-muted"
                                            }`}
                                    >
                                        {actionIcon[interaction.actionType] ?? (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-medium text-foreground">
                                                {actionLabel[interaction.actionType] ??
                                                    interaction.actionType}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                via {interaction.tag.shortCode}
                                            </span>
                                        </div>
                                        {interaction.message && (
                                            <p className="text-sm text-muted-foreground mt-1 italic">
                                                &ldquo;{interaction.message}&rdquo;
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(interaction.timestamp).toLocaleString()}
                                            </span>
                                            {interaction.cityGuess && (
                                                <>
                                                    <span className="text-xs text-muted-foreground">·</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        📍 {interaction.cityGuess}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
