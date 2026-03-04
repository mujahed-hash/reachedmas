import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, BarChart3, TrendingUp, Users, QrCode, MessageCircle } from "lucide-react";

async function getAnalytics() {
    // Use UTC dates consistently to match database timestamps
    const now = new Date();

    // Today at midnight UTC
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // 7 days ago at midnight UTC  
    const weekAgoUTC = new Date(todayUTC.getTime() - 7 * 24 * 60 * 60 * 1000);

    // First day of this month UTC
    const monthStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Get counts by period
    const [
        usersToday,
        usersThisWeek,
        usersThisMonth,
        usersTotal,
        scansToday,
        scansThisWeek,
        scansThisMonth,
        scansTotal,
        messagesTotal,
    ] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: todayUTC } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgoUTC } } }),
        prisma.user.count({ where: { createdAt: { gte: monthStartUTC } } }),
        prisma.user.count(),
        prisma.interaction.count({ where: { timestamp: { gte: todayUTC } } }),
        prisma.interaction.count({ where: { timestamp: { gte: weekAgoUTC } } }),
        prisma.interaction.count({ where: { timestamp: { gte: monthStartUTC } } }),
        prisma.interaction.count(),
        prisma.notification.count(),
    ]);

    // Get interaction breakdown
    const interactionTypes = await prisma.interaction.groupBy({
        by: ["actionType"],
        _count: true,
    });

    return {
        users: { today: usersToday, week: usersThisWeek, month: usersThisMonth, total: usersTotal },
        scans: { today: scansToday, week: scansThisWeek, month: scansThisMonth, total: scansTotal },
        messagesTotal,
        interactionTypes,
    };
}

export default async function AdminAnalyticsPage() {
    const analytics = await getAnalytics();

    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Platform Intelligence</h1>
                    <p className="text-slate-500">Usage statistics and growth trends</p>
                </div>
            </div>

            {/* Growth Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Users className="h-5 w-5 text-blue-400" />
                            User Acquisition
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricBox value={analytics.users.today} label="Today" />
                            <MetricBox value={analytics.users.week} label="7 Days" />
                            <MetricBox value={analytics.users.month} label="30 Days" />
                            <MetricBox value={analytics.users.total} label="Total Growth" highlight />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <QrCode className="h-5 w-5 text-indigo-400" />
                            Scan Engagement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricBox value={analytics.scans.today} label="Today" />
                            <MetricBox value={analytics.scans.week} label="7 Days" />
                            <MetricBox value={analytics.scans.month} label="30 Days" />
                            <MetricBox value={analytics.scans.total} label="Total Scans" color="text-indigo-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Interaction Breakdown */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <MessageCircle className="h-5 w-5 text-emerald-400" />
                        Protocol Activity Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {analytics.interactionTypes.map((type) => (
                            <div key={type.actionType} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-2xl font-bold text-white">{type._count}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                                    {type.actionType.replace("_", " ")}
                                </p>
                            </div>
                        ))}
                        {analytics.interactionTypes.length === 0 && (
                            <div className="col-span-4 text-center py-12 text-slate-600 italic">
                                No cryptographic interactions logged
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricBox({ value, label, highlight = false, color = "text-white" }: { value: number; label: string; highlight?: boolean; color?: string }) {
    return (
        <div className={`text-center p-4 rounded-xl transition-all ${highlight ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5 border border-white/5 shadow-inner'}`}>
            <p className={`text-3xl font-bold ${highlight ? 'text-indigo-400' : color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">{label}</p>
        </div>
    );
}
