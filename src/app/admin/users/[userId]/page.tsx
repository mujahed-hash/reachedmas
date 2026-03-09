import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Shield, 
    ArrowLeft, 
    Package, 
    Mail, 
    Phone, 
    Calendar, 
    Bell, 
    ExternalLink, 
    CreditCard,
    Fingerprint,
    History,
    Tag as TagIcon
} from "lucide-react";
import { UserActions } from "@/components/admin/user-actions";
import { TagActions } from "@/components/admin/tag-actions";
import { AssetActions } from "@/components/admin/asset-actions";

async function getUserDetail(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            assets: {
                include: {
                    tags: {
                        include: {
                            _count: {
                                select: { interactions: true }
                            }
                        }
                    }
                }
            },
            notifications: {
                orderBy: { createdAt: "desc" },
                take: 10,
                include: {
                    interaction: true
                }
            },
            _count: {
                select: {
                    assets: true,
                    notifications: true,
                    familyMemberships: true,
                    familyOwned: true
                }
            }
        }
    });
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    console.log(`[ADMIN_DEBUG] Accessing User Profile: ${userId}`);
    const session = await auth();
    console.log(`[ADMIN_DEBUG] Session User ID: ${session?.user?.id}`);
    const user = await getUserDetail(userId);

    if (!user) {
        notFound();
    }

    const totalScans = user.assets.reduce(
        (sum, a) => sum + a.tags.reduce((ts, t) => ts + t._count.interactions, 0),
        0
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white border border-white/5">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{user.email}</h1>
                            {user.id === session?.user?.id && (
                                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20">You</Badge>
                            )}
                        </div>
                        <p className="text-slate-500 font-mono text-sm mt-1">ID: {user.id}</p>
                    </div>
                </div>
                <UserActions
                    userId={user.id}
                    userEmail={user.email}
                    currentRole={user.role}
                    currentPlan={user.plan}
                    isCurrentUser={user.id === session?.user?.id}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <Card className="lg:col-span-1 border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Profile Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-1">
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Role & Permissions</label>
                            <div className="flex items-center gap-2">
                                <Badge className={user.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-slate-700'}>
                                    {user.role}
                                </Badge>
                                <Badge variant="outline" className={user.plan === 'PREMIUM' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' : ''}>
                                    {user.plan}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Public ID</label>
                            <div className="text-slate-200 font-mono text-sm bg-black/20 p-2 rounded border border-white/5">
                                {user.publicId}
                            </div>
                        </div>

                        <div className="grid gap-1 pt-2">
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-2">
                                <Calendar className="h-4 w-4" />
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-2">
                                <History className="h-4 w-4" />
                                Updated {new Date(user.updatedAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-3">Stripe Integration</label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Customer ID
                                    </span>
                                    <span className="font-mono text-xs text-slate-300">
                                        {user.stripeCustomerId || "None"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Subscription
                                    </span>
                                    <span className="font-mono text-xs text-slate-300">
                                        {user.stripeSubscriptionId || "None"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Engagement Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Assets", value: user._count.assets, icon: Package, color: "text-blue-400" },
                            { label: "Scans", value: totalScans, icon: Fingerprint, color: "text-indigo-400" },
                            { label: "Alerts", value: user._count.notifications, icon: Bell, color: "text-orange-400" },
                            { label: "Family", value: user._count.familyOwned + user._count.familyMemberships, icon: Shield, color: "text-emerald-400" },
                        ].map((stat) => (
                            <Card key={stat.label} className="border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center text-center">
                                <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-tight">{stat.label}</div>
                            </Card>
                        ))}
                    </div>

                    {/* Assets & Tags */}
                    <Card className="border-white/10 bg-white/5 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5 text-indigo-400" />
                                Registered Assets ({user.assets.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {user.assets.map((asset) => (
                                    <div key={asset.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-white">{asset.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{asset.type}</p>
                                                    <Badge variant={asset.isActive ? "default" : "outline"} className={asset.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-0 h-4 text-[10px]" : "text-slate-500 border-white/5 py-0 h-4 text-[10px]"}>
                                                        {asset.isActive ? "Active" : "Locked"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <AssetActions assetId={asset.id} assetName={asset.name} isActive={asset.isActive} />
                                        </div>
                                        <div className="space-y-2">
                                            {asset.tags.map((tag) => (
                                                <div key={tag.id} className="flex items-center justify-between bg-black/20 p-2 rounded text-sm group">
                                                    <div className="flex items-center gap-3">
                                                        <TagIcon className="h-3 w-3 text-slate-500" />
                                                        <span className="font-mono text-indigo-400">{tag.shortCode}</span>
                                                        <Badge className={tag.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                                                            {tag.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-slate-500 font-bold">{tag._count.interactions} scans</span>
                                                        <TagActions tagId={tag.id} shortCode={tag.shortCode} currentStatus={tag.status} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {user.assets.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 italic">No assets registered yet</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Notifications */}
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-orange-400" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {user.notifications.map((notif) => (
                                    <div key={notif.id} className="flex items-start gap-3 p-3 rounded bg-white/5 border-l-2 border-primary/30">
                                        <div className="mt-1">
                                            <Bell className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm text-slate-200">{notif.title}</p>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">{notif.body}</p>
                                        </div>
                                    </div>
                                ))}
                                {user.notifications.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 italic">No activity history</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
