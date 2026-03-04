import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { FamilyManager } from "@/components/family-manager";
import { getFamilyMembers, getFamilyOwnerships } from "@/app/actions/family";
import { prisma } from "@/lib/db";
import { ChevronLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FamilyPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const [members, ownerships, unreadCount] = await Promise.all([
        getFamilyMembers(),
        getFamilyOwnerships(),
        prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    ]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header variant="dashboard" session={session} unreadCount={unreadCount} />

            <main className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>

                {/* Page Title */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Family & Sharing</h1>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        Share access to your assets with family members, or manage groups that have shared assets with you. Everyone in your family group receives notifications for scans and emergencies.
                    </p>
                </div>

                <FamilyManager
                    members={members as any}
                    ownerships={ownerships as any}
                />
            </main>
        </div>
    );
}
