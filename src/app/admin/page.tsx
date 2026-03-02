import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Shield,
    Users,
    Car,
    QrCode,
    MessageCircle,
    BarChart3,
    Settings,
    ChevronRight,
} from "lucide-react";

async function getAdminStats() {
    const [userCount, vehicleCount, tagCount, interactionCount, notificationCount] =
        await Promise.all([
            prisma.user.count(),
            prisma.vehicle.count(),
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
                    vehicle: {
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
        vehicleCount,
        tagCount,
        interactionCount,
        notificationCount,
        recentInteractions,
    };
}

export default async function AdminDashboard() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Check if user is admin (for now, check role)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const stats = await getAdminStats();

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
                    <nav className="flex items-center gap-2">
                        <Link href="https://reachmasked.com/dashboard">
                            <Button variant="outline" size="sm">
                                User Dashboard
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.userCount}</p>
                                    <p className="text-xs text-muted-foreground">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <Car className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.vehicleCount}</p>
                                    <p className="text-xs text-muted-foreground">Vehicles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <QrCode className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.tagCount}</p>
                                    <p className="text-xs text-muted-foreground">Active Tags</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <BarChart3 className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.interactionCount}</p>
                                    <p className="text-xs text-muted-foreground">Total Scans</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-pink-500/10">
                                    <MessageCircle className="h-5 w-5 text-pink-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.notificationCount}</p>
                                    <p className="text-xs text-muted-foreground">Notifications</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link href="/users">
                        <Card className="border-border bg-card hover:bg-accent/50 transition cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Manage Users
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    View, search, and manage all registered users
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/tags">
                        <Card className="border-border bg-card hover:bg-accent/50 transition cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <QrCode className="h-5 w-5" />
                                        Manage Tags
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    View all tags, disable suspicious activity
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/analytics">
                        <Card className="border-border bg-card hover:bg-accent/50 transition cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Analytics
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    View usage statistics and trends
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Recent Activity */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentInteractions.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No activity yet</p>
                            ) : (
                                stats.recentInteractions.map((interaction) => (
                                    <div
                                        key={interaction.id}
                                        className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {interaction.actionType.replace("_", " ")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {interaction.tag.vehicle.color} {interaction.tag.vehicle.model} •{" "}
                                                {interaction.tag.vehicle.owner.email}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(interaction.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
