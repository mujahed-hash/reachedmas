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
    const users = await getUsers();
    const session = await auth();

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-slate-500">
                        {users.length} registered users • Real-time data from database
                    </p>
                </div>
            </div>

            {/* Users List */}
            <div className="grid gap-4">
                {users.map((user) => {
                    const totalScans = user.vehicles.reduce(
                        (sum, v) => sum + v.tags.reduce((ts, t) => ts + t._count.interactions, 0),
                        0
                    );

                    return (
                        <Card key={user.id} className="border-white/10 bg-white/5 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-white">{user.email}</h3>
                                                <Badge
                                                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                                                    className={
                                                        user.role === "ADMIN"
                                                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                            : "bg-white/5 text-slate-400 border-white/10"
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Car className="h-4 w-4" />
                                                    {user._count.vehicles} vehicles
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Bell className="h-4 w-4" />
                                                    {user._count.notifications} alerts
                                                </span>
                                                <span className="flex items-center gap-1 text-indigo-400">
                                                    {totalScans} total scans
                                                </span>
                                                {user.phoneEncrypted && (
                                                    <span className="flex items-center gap-1 text-emerald-400">
                                                        <Mail className="h-4 w-4" />
                                                        Identity Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                <Calendar className="h-3 w-3" />
                                                Joined {new Date(user.createdAt).toLocaleDateString()}
                                            </div>

                                            {/* Vehicles */}
                                            {user.vehicles.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {user.vehicles.map((v) => (
                                                        <div
                                                            key={v.id}
                                                            className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400"
                                                        >
                                                            <span className="font-medium text-slate-300">
                                                                {v.color} {v.model}
                                                            </span>
                                                            <span className="ml-1 opacity-50">
                                                                • {v.tags.length} active tags
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
                                        isCurrentUser={user.id === session?.user?.id}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {users.length === 0 && (
                    <Card className="border-white/10 bg-white/5 text-center p-12">
                        <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500">No users found in the system</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
