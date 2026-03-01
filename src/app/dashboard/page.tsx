import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Car, BarChart3, QrCode, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { VehicleCard } from "@/components/vehicle-card";
import { Header } from "@/components/header";

interface VehicleWithTags {
    id: string;
    model: string;
    color: string;
    tags: { id: string; shortCode: string }[];
}

interface ActivityWithTag {
    id: string;
    actionType: string;
    timestamp: Date;
    tag: {
        vehicle: {
            color: string;
            model: string;
        };
    };
}

interface NotificationData {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: Date;
}

async function getDashboardData(userId: string): Promise<{
    vehicles: VehicleWithTags[];
    totalScans: number;
    recentActivity: ActivityWithTag[];
    notifications: NotificationData[];
    unreadCount: number;
}> {
    const vehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        include: {
            tags: true,
            _count: {
                select: {
                    tags: true,
                },
            },
        },
    });

    // Get scan counts for user's vehicles
    const vehicleIds = vehicles.map((v: VehicleWithTags) => v.id);
    const totalScans = await prisma.interaction.count({
        where: {
            tag: {
                vehicleId: { in: vehicleIds },
            },
        },
    });

    // Get recent activity
    const recentActivity = await prisma.interaction.findMany({
        where: {
            tag: {
                vehicleId: { in: vehicleIds },
            },
        },
        include: {
            tag: {
                include: {
                    vehicle: true,
                },
            },
        },
        orderBy: { timestamp: "desc" },
        take: 5,
    });

    // Get notifications for this user
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
    });

    return { vehicles, totalScans, recentActivity, notifications, unreadCount };
}


export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const { vehicles, totalScans, recentActivity, notifications, unreadCount } = await getDashboardData(session.user.id);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header variant="dashboard" session={session} unreadCount={unreadCount} />

            <main className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                        <p className="text-muted-foreground">Manage your vehicles and tags</p>
                    </div>
                    <AddVehicleDialog />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon={<Car className="h-5 w-5" />}
                        label="Vehicles"
                        value={vehicles.length.toString()}
                    />
                    <StatCard
                        icon={<QrCode className="h-5 w-5" />}
                        label="Total Scans"
                        value={totalScans.toString()}
                    />
                    <StatCard
                        icon={<BarChart3 className="h-5 w-5" />}
                        label="Active Tags"
                        value={vehicles.reduce((acc: number, v: { tags: unknown[] }) => acc + v.tags.length, 0).toString()}
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Vehicles List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Your Vehicles</h2>
                        {vehicles.length === 0 ? (
                            <Card className="border-border bg-card">
                                <CardContent className="p-8 text-center">
                                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="font-semibold text-foreground mb-2">No vehicles yet</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Add your first vehicle to get started with ReachMasked
                                    </p>
                                    <AddVehicleDialog />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {vehicles.map((vehicle) => (
                                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Messages Received</h2>
                        <Card className="border-border bg-card">
                            <CardContent className="p-4 space-y-4">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-6">
                                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground text-sm">
                                            No messages yet
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            When someone contacts you about your vehicle, you&apos;ll see it here.
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className={`flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0 ${!notif.isRead ? "bg-primary/5 -mx-4 px-4 py-2 rounded" : ""}`}>
                                            <div className={`w-2 h-2 rounded-full mt-2 ${!notif.isRead ? "bg-red-500" : "bg-muted-foreground"}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notif.body}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </p>
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
                                    <p className="text-muted-foreground text-sm text-center py-4">
                                        No activity yet
                                    </p>
                                ) : (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">
                                                    {activity.actionType.replace("_", " ")}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {activity.tag.vehicle.color} {activity.tag.vehicle.model}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity.timestamp).toLocaleDateString()}
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

