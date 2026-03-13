import { auth } from "@/lib/auth";
import { getFreeTagStatus } from "@/lib/free-tag";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, BarChart3, QrCode, MessageCircle, Dog, Home, User, Package, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AddAssetDialog } from "@/components/add-asset-dialog";
import { AssetCard } from "@/components/asset-card";
import { Header } from "@/components/header";

interface AssetWithTags {
    id: string;
    type: string;
    name: string;
    subtitle: string | null;
    tags: { id: string; shortCode: string }[];
    isShared?: boolean;
    owner?: { name: string | null; email: string };
}

async function getDashboardData(userId: string) {
    const personalAssets = await prisma.asset.findMany({
        where: { ownerId: userId },
        include: {
            tags: true,
            _count: { select: { tags: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch assets shared with this user via FamilyMember
    const sharedMemberships = await prisma.familyMember.findMany({
        where: { memberId: userId },
        include: {
            owner: {
                include: {
                    assets: {
                        include: {
                            tags: true,
                            owner: { select: { name: true, email: true } },
                        },
                    },
                },
            },
        },
    });

    const sharedAssets: AssetWithTags[] = sharedMemberships.flatMap(m =>
        m.owner.assets.map(a => ({
            ...a,
            isShared: true,
            owner: a.owner,
        }))
    );

    const assets = [...personalAssets, ...sharedAssets];

    const assetIds = assets.map((a: AssetWithTags) => a.id);
    const totalScans = await prisma.interaction.count({
        where: {
            tag: {
                assetId: { in: assetIds },
            },
        },
    });

    // Recent activity
    const recentActivity = await prisma.interaction.findMany({
        where: {
            tag: {
                assetId: { in: assetIds },
            },
        },
        include: {
            tag: { include: { asset: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 5,
    });

    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
    });

    return { assets, totalScans, recentActivity, notifications, unreadCount };
}

const typeIcons: Record<string, any> = {
    CAR: Car, PET: Dog, HOME: Home, PERSON: User, ASSET: Package,
};

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
    // Double check user exists in DB (handle stale sessions after resets)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    }) as any;

    if (!user) {
        console.warn(`[Dashboard] Auth session exists but user record missing: ${session.user.id}`);
        // We can't easily logout from RSC, but redirecting to login should help.
        // Or better, a specialized error page or clear session path.
        redirect("/login?error=SessionExpired");
    }

    const { assets, totalScans, recentActivity, notifications, unreadCount } = await getDashboardData(session.user.id);
    
    // Check if user is eligible to bypass paywall via free tag grant
    const freeTagInfo = getFreeTagStatus({
        freeTagGranted: user?.freeTagGranted || false,
        freeTagGrantedAt: user?.freeTagGrantedAt || null,
        freeTagTrialDays: user?.freeTagTrialDays || 0,
        freeTagGraceDays: user?.freeTagGraceDays || 0,
        plan: user?.plan || "FREE"
    });
    // Eligible if they have an active or grace free tag AND they haven't used it (0 assets)
    const isFreeTagEligible = (freeTagInfo.status === "ACTIVE" || freeTagInfo.status === "GRACE") && assets.length === 0;

    console.log("[Dashboard] Free Tag Auth Trace:", {
        userId: session.user.id,
        freeTagInfo: freeTagInfo,
        assetsLength: assets.length,
        isFreeTagEligible: isFreeTagEligible
    });

    // Group assets by type for display
    const assetsByType = assets.reduce((acc: Record<string, AssetWithTags[]>, asset: AssetWithTags) => {
        const type = asset.type || "CAR";
        if (!acc[type]) acc[type] = [];
        acc[type].push(asset);
        return acc;
    }, {});

    const typeLabels: Record<string, string> = {
        CAR: "Vehicles", PET: "Pets", HOME: "Homes", PERSON: "People", ASSET: "Assets",
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header variant="dashboard" session={session} unreadCount={unreadCount} />

            <main className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                        <p className="text-muted-foreground">Manage your assets and tags</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/family">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Users className="h-4 w-4" />
                                Family
                            </Button>
                        </Link>
                        <AddAssetDialog plan={user.plan} isFreeTagEligible={isFreeTagEligible} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard icon={<QrCode className="h-5 w-5" />} label="Total Assets" value={assets.length.toString()} />
                    <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Total Scans" value={totalScans.toString()} />
                    <StatCard icon={<Car className="h-5 w-5" />} label="Active Tags" value={assets.reduce((acc: number, a: { tags: unknown[] }) => acc + a.tags.length, 0).toString()} />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Assets grouped by type */}
                    <div className="lg:col-span-2 space-y-6">
                        {assets.length === 0 ? (
                            <Card className="border-border bg-card">
                                <CardContent className="p-8 text-center">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground mb-2">No assets yet</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Add your first asset — a vehicle, pet, home, or anything you want to protect.
                                    </p>
                                    <AddAssetDialog plan={user.plan} isFreeTagEligible={isFreeTagEligible} />
                                </CardContent>
                            </Card>
                        ) : (
                            Object.entries(assetsByType).map(([type, typeAssets]) => {
                                const Icon = typeIcons[type] || Package;
                                const typedAssets = typeAssets as AssetWithTags[];
                                return (
                                    <div key={type}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <h2 className="text-lg font-semibold text-foreground">
                                                {typeLabels[type] || type}
                                            </h2>
                                            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                                {typedAssets.length}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {typedAssets.map((asset) => (
                                                <AssetCard key={asset.id} asset={asset} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Right Column: Notifications + Activity */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Messages Received</h2>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4 space-y-4">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-6">
                                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground text-sm">No messages yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            When someone contacts you about your asset, you&apos;ll see it here.
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            className={`relative flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0 transition-all ${
                                                !notif.isRead 
                                                    ? "bg-primary/10 -mx-4 px-4 py-3 rounded-lg shadow-sm border-l-4 border-l-primary" 
                                                    : "pt-4"
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {!notif.isRead && (
                                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                    )}
                                                    <p className={`text-sm font-semibold text-foreground ${!notif.isRead ? "text-primary" : ""}`}>
                                                        {notif.title}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notif.body}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                                        {new Date(notif.createdAt).toLocaleString()}
                                                    </p>
                                                    {!notif.isRead && (
                                                        <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase tracking-tighter">New</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <h2 className="text-xl font-semibold text-foreground mt-6">Scan History</h2>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4 space-y-4">
                                {recentActivity.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">No activity yet</p>
                                ) : (
                                    recentActivity.map((activity: any) => (
                                        <div key={activity.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0 last:pb-0 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-1.5 h-10 bg-primary/20 rounded-full overflow-hidden">
                                                    <div className="w-full h-1/2 bg-primary group-hover:h-full transition-all duration-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground capitalize tracking-tight">
                                                    {activity.actionType.toLowerCase().replace("_", " ")}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate font-medium">
                                                    {activity.tag?.asset?.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                                                    {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">{icon}</div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
