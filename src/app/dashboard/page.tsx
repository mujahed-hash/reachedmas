import { auth } from "@/lib/auth";
import { getFreeTagStatus } from "@/lib/free-tag";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, BarChart3, QrCode, MessageCircle, Dog, Home, User, Package, Users, Tag as TagIcon } from "lucide-react";
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
        redirect("/login");
    }

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

    const activeTagsCount = assets.reduce((sum: number, asset: AssetWithTags) => {
        return sum + (asset.tags && asset.tags.length > 0 ? 1 : 0);
    }, 0);

    const typeLabels: Record<string, string> = {
        CAR: "Vehicles", PET: "Pets", HOME: "Homes", PERSON: "People", ASSET: "Assets",
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header variant="dashboard" session={session} unreadCount={unreadCount} />

            <main className="container max-w-2xl mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="flex items-center justify-between mb-10 mt-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Tags</h1>
                        <span className="bg-primary/20 text-primary dark:text-[#95C8FF] text-sm px-3 py-1 rounded-full font-bold">
                            {assets.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/family">
                            <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex text-muted-foreground hover:text-foreground">
                                <Users className="h-4 w-4" />
                                Family
                            </Button>
                        </Link>
                        <AddAssetDialog plan={user.plan} isFreeTagEligible={isFreeTagEligible} />
                    </div>
                </div>

                {/* Header Description & Stats Grid */}
                <div className="mb-10 relative group pb-4">
                    <p className="text-muted-foreground font-semibold tracking-wide mb-6 relative z-10 px-2 lg:px-0">Manage your assets and tags</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 relative z-10 px-1">
                        <StatCard icon={<Package className="h-5 w-5 md:h-6 md:w-6 text-foreground/80 group-hover:text-foreground transition-colors" />} label="Total Assets" value={assets.length.toString()} />
                        <StatCard icon={<QrCode className="h-5 w-5 md:h-6 md:w-6 text-foreground/80 group-hover:text-foreground transition-colors" />} label="Total Scans" value={totalScans.toString()} />
                        <StatCard highlight className="col-span-2 lg:col-span-1" icon={<TagIcon className="h-6 w-6 text-primary dark:text-[#6C60FF]" />} label="Active Tags" value={activeTagsCount.toString()} />
                    </div>
                </div>

                {/* Single Column Layout */}
                <div className="flex flex-col gap-10">
                    {/* Assets grouped by type */}
                    <div className="space-y-8">
                        {assets.length === 0 ? (
                            <Card className="rounded-[2rem] border-border bg-card/50 backdrop-blur-md">
                                <CardContent className="p-10 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-[inset_0_0_12px_rgba(33,19,255,0.1)]">
                                        <Package className="h-8 w-8 text-primary dark:text-[#6C60FF]" />
                                    </div>
                                    <h3 className="font-semibold text-lg text-foreground mb-2">No tags active</h3>
                                    <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                                        Add your first asset to generate a secure, anonymous contact code.
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
                                        <div className="flex items-center gap-2 mb-4 px-2">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                {typeLabels[type] || type}
                                            </h2>
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

                    {/* Messages & Notifications Stack */}
                    <div className="space-y-4 pt-6 border-t border-border/50">
                        <h2 className="text-lg font-bold text-foreground px-2">Messages & Alerts</h2>
                        <Card className="rounded-[2rem] border-border bg-card/50 backdrop-blur-md">
                            <CardContent className="p-6 flex flex-col gap-4">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-6">
                                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <p className="text-muted-foreground text-sm font-medium">No messages yet</p>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                                            When someone contacts you about your asset, you&apos;ll see it here.
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            className={`relative flex flex-col gap-2 p-5 transition-all duration-300 rounded-[1.25rem] border ${
                                                !notif.isRead 
                                                    ? "bg-primary/10 border-primary/20 shadow-[inset_0_0_15px_rgba(33,19,255,0.05)]" 
                                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    {!notif.isRead && (
                                                        <div className="w-2 h-2 rounded-full bg-[#2113FF] animate-pulse shadow-[0_0_12px_rgba(33,19,255,0.8)] flex-shrink-0" />
                                                    )}
                                                    <h4 className={`text-sm font-bold tracking-wide ${!notif.isRead ? "text-primary dark:text-[#95C8FF]" : "text-foreground"}`}>
                                                        {notif.title}
                                                    </h4>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest whitespace-nowrap">
                                                    {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                                                {notif.body}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <h2 className="text-xl font-bold text-foreground mt-8 px-2 tracking-tight">Scan History</h2>
                        <Card className="rounded-[2rem] border-border bg-card/50 backdrop-blur-md">
                            <CardContent className="p-6 flex flex-col gap-2">
                                {recentActivity.length === 0 ? (
                                    <p className="text-muted-foreground text-sm font-medium text-center py-6 opacity-50">No activity yet</p>
                                ) : (
                                    recentActivity.map((activity: any) => (
                                        <div key={activity.id} className="flex items-center gap-4 py-4 px-3 border-b border-white/5 last:border-0 last:pb-4 group hover:bg-white/5 rounded-xl transition-colors">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-1.5 h-10 bg-primary/20 rounded-full overflow-hidden relative">
                                                    <div className="absolute bottom-0 w-full h-1/2 bg-primary group-hover:h-full transition-all duration-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground capitalize tracking-wide">
                                                    {activity.actionType.toLowerCase().replace("_", " ")}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                                                    {activity.tag?.asset?.name}
                                                </p>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                                    {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground/50 mt-1 font-semibold">
                                                    {new Date(activity.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
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

function StatCard({ icon, label, value, className = "", highlight = false }: { icon: React.ReactNode; label: string; value: string; className?: string; highlight?: boolean }) {
    return (
        <Card className={`relative overflow-hidden rounded-[1.25rem] md:rounded-[1.5rem] bg-card dark:bg-white/[0.02] dark:backdrop-blur-[40px] transition-transform duration-500 ease-out hover:-translate-y-1 group ${highlight ? 'dark:bg-white/[0.04] border-primary/20 dark:border-white/10 dark:hover:border-[#2113FF]/60 shadow-lg dark:shadow-[0_8px_30px_rgba(33,19,255,0.15)] dark:hover:shadow-[0_8px_40px_rgba(33,19,255,0.25)]' : 'dark:bg-[#08090a]/50 border-border dark:border-white/5 hover:border-primary/20 dark:hover:border-[#2113FF]/20 shadow-sm dark:shadow-lg'} ${className}`}>

            {/* Glowing blur injected directly INSIDE the card - DARK MODE ONLY */}
            <div className={`absolute -inset-10 rounded-full mix-blend-screen filter blur-[50px] pointer-events-none transition-all duration-700 hidden dark:block ${highlight ? 'bg-[#0F00FFD4] opacity-20 md:opacity-30 group-hover:opacity-40' : 'bg-[#2113FF] opacity-10 md:opacity-15 group-hover:opacity-20'}`} />

            <CardContent className="p-5 md:p-6 flex items-center justify-between relative z-10 cursor-default">
                <div>
                    <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-primary dark:text-[#95C8FF] dark:drop-shadow-[0_0_8px_rgba(33,19,255,0.4)]' : 'text-zinc-500 tracking-wider'}`}>{label}</p>
                    <p className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight drop-shadow-sm">{value}</p>
                </div>
                
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300 md:group-hover:scale-105 ${
                    highlight 
                        ? 'bg-primary/10 dark:bg-gradient-to-br dark:from-[#0F00FFD4] dark:to-transparent border border-primary/20 dark:border-[#2113FF]/20 shadow-sm dark:shadow-[inset_0_0_12px_rgba(33,19,255,0.15)]'
                        : 'bg-muted/50 dark:bg-white/5 border border-border dark:border-white/10 shadow-sm dark:shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]'
                }`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}
