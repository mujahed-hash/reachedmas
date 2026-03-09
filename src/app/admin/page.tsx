import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Shield,
    Users,
    Package,
    QrCode,
    MessageCircle,
    BarChart3,
    Settings,
    ChevronRight,
} from "lucide-react";

async function getAdminStats() {
    const [userCount, assetCount, tagCount, interactionCount, notificationCount] =
        await Promise.all([
            prisma.user.count(),
            prisma.asset.count(),
            prisma.tag.count(),
            prisma.interaction.count(),
            prisma.notification.count(),
        ]);

    // Get recent activity
    const recentInteractions = await prisma.interaction.findMany({
        orderBy: { timestamp: "desc" },
        take: 10,
        include: {
            tag: {
                include: {
                    asset: {
                        include: {
                            owner: {
                                select: { email: true },
                            },
                        },
                    },
                },
            },
        },
    });

    return {
        userCount,
        assetCount,
        tagCount,
        interactionCount,
        notificationCount,
        recentInteractions,
    };
}

export default async function AdminDashboard() {
    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Command Center Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={<Users className="h-5 w-5 text-blue-400" />} value={stats.userCount} label="Total Users" />
                <StatCard icon={<Package className="h-5 w-5 text-emerald-400" />} value={stats.assetCount} label="Assets" />
                <StatCard icon={<QrCode className="h-5 w-5 text-indigo-400" />} value={stats.tagCount} label="Active Tags" />
                <StatCard icon={<BarChart3 className="h-5 w-5 text-amber-400" />} value={stats.interactionCount} label="Total Scans" />
                <StatCard icon={<MessageCircle className="h-5 w-5 text-rose-400" />} value={stats.notificationCount} label="Notifications" />
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-6">
                <AdminLink href="/admin/users" icon={<Users className="h-5 w-5 text-blue-400" />} title="Manage Users" description="View, search, and manage all registered users" />
                <AdminLink href="/admin/tags" icon={<QrCode className="h-5 w-5 text-indigo-400" />} title="Manage Tags" description="View all tags, disable suspicious activity" />
                <AdminLink href="/admin/analytics" icon={<BarChart3 className="h-5 w-5 text-amber-400" />} title="Analytics" description="View usage statistics and trends" />
            </div>

            {/* Recent Activity */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white">Recent Security Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recentInteractions.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">No activity yet</p>
                        ) : (
                            stats.recentInteractions.map((interaction) => (
                                <div
                                    key={interaction.id}
                                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200">
                                            {interaction.actionType.replace("_", " ")}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {interaction.tag.asset.name} •{" "}
                                            {interaction.tag.asset.owner.email}
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(interaction.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
    return (
        <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-xs text-slate-500">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AdminLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
    return (
        <Link href={href}>
            <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer group">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                        <span className="flex items-center gap-2">
                            {icon}
                            {title}
                        </span>
                        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-400 text-sm">
                        {description}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}
