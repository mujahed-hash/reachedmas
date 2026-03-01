import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Users, Car, Mail, Phone, Calendar, Bell } from "lucide-react";
import { UserActions } from "@/components/admin/user-actions";

async function getUsers() {
    return prisma.user.findMany({
        include: {
            _count: {
                select: {
                    vehicles: true,
                    notifications: true,
                },
            },
            vehicles: {
                include: {
                    tags: {
                        select: {
                            shortCode: true,
                            status: true,
                            _count: {
                                select: { interactions: true },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export default async function AdminUsersPage() {
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

    const users = await getUsers();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/admin" className="flex items-center gap-2 transition-opacity hover:opacity-80">
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
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">
                            {users.length} registered users • Real-time data from database
                        </p>
                    </div>
                </div>

                {/* Users List */}
                <div className="space-y-4">
                    {users.map((user) => {
                        const totalScans = user.vehicles.reduce(
                            (sum, v) => sum + v.tags.reduce((ts, t) => ts + t._count.interactions, 0),
                            0
                        );

                        return (
                            <Card key={user.id} className="border-border bg-card">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-foreground">{user.email}</h3>
                                                    <Badge
                                                        variant={user.role === "ADMIN" ? "default" : "secondary"}
                                                        className={
                                                            user.role === "ADMIN"
                                                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                                : ""
                                                        }
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Car className="h-4 w-4" />
                                                        {user._count.vehicles} vehicles
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Bell className="h-4 w-4" />
                                                        {user._count.notifications} notifications
                                                    </span>
                                                    <span className="flex items-center gap-1 text-purple-500">
                                                        {totalScans} total scans
                                                    </span>
                                                    {user.phoneEncrypted && (
                                                        <span className="flex items-center gap-1 text-green-500">
                                                            <Phone className="h-4 w-4" />
                                                            Phone verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    Joined {new Date(user.createdAt).toLocaleDateString()} at{" "}
                                                    {new Date(user.createdAt).toLocaleTimeString()}
                                                </div>

                                                {/* Vehicles */}
                                                {user.vehicles.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {user.vehicles.map((v) => (
                                                            <div
                                                                key={v.id}
                                                                className="text-xs bg-muted px-2 py-1 rounded"
                                                            >
                                                                <span className="font-medium">
                                                                    {v.color} {v.model}
                                                                </span>
                                                                {v.licensePlateHash && (
                                                                    <span className="text-muted-foreground ml-1">
                                                                        ({v.licensePlateHash})
                                                                    </span>
                                                                )}
                                                                <span className="text-muted-foreground ml-1">
                                                                    • {v.tags.length} tags
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <UserActions
                                            userId={user.id}
                                            userEmail={user.email}
                                            currentRole={user.role}
                                            isCurrentUser={user.id === session.user.id}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {users.length === 0 && (
                        <Card className="border-border bg-card">
                            <CardContent className="p-8 text-center">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No users registered yet</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
