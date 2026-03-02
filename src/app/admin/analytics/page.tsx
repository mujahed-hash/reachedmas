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
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (currentUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const analytics = await getAnalytics();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <Shield className="h-6 w-6 text-red-500" />
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            ReachMasked Admin
                        </span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Analytics</h1>
                        <p className="text-muted-foreground">Platform usage statistics and trends</p>
                    </div>
                </div>

                {/* User Growth */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                User Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-3xl font-bold text-foreground">{analytics.users.today}</p>
                                    <p className="text-sm text-muted-foreground">Today</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-3xl font-bold text-foreground">{analytics.users.week}</p>
                                    <p className="text-sm text-muted-foreground">This Week</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-3xl font-bold text-foreground">{analytics.users.month}</p>
                                    <p className="text-sm text-muted-foreground">This Month</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-primary/10">
                                    <p className="text-3xl font-bold text-primary">{analytics.users.total}</p>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-purple-500" />
                                Scan Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-3xl font-bold text-foreground">{analytics.scans.today}</p>
                                    <p className="text-sm text-muted-foreground">Today</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-3xl font-bold text-foreground">{analytics.scans.week}</p>
                                    <p className="text-sm text-muted-foreground">This Week</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-3xl font-bold text-foreground">{analytics.scans.month}</p>
                                    <p className="text-sm text-muted-foreground">This Month</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-purple-500/10">
                                    <p className="text-3xl font-bold text-purple-500">{analytics.scans.total}</p>
                                    <p className="text-sm text-muted-foreground">Total Scans</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Interaction Breakdown */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-green-500" />
                            Interaction Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {analytics.interactionTypes.map((type) => (
                                <div key={type.actionType} className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-2xl font-bold text-foreground">{type._count}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {type.actionType.replace("_", " ")}
                                    </p>
                                </div>
                            ))}
                            {analytics.interactionTypes.length === 0 && (
                                <div className="col-span-4 text-center py-8 text-muted-foreground">
                                    No interactions recorded yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
