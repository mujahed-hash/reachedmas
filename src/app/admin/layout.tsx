import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, Users, QrCode, BarChart3, Settings, LogOut, Printer } from "lucide-react";
import { SignalTagLogo } from "@/components/signal-tag-logo";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // SECURITY: Enforce path detection via headers (set in middleware.ts)
    const headersList = await headers();
    const path = headersList.get("x-path") || "";
    const isPublicPage = path.includes("/admin/login") || path.includes("/admin/setup");

    const session = await auth();

    // SECURITY: Enforce auth for non-public admin pages
    if (!session?.user?.id && !isPublicPage) {
        console.log(`[ADMIN_DEBUG] Unauthorized access attempt to ${path}. Redirecting to /admin/login`);
        // SAFETY: Only redirect if NOT already on a login-adjacent path to prevent loops
        if (!path.includes("login") && !path.includes("setup")) {
            redirect("/admin/login");
        }
    }

    // SECURITY: Enforce ADMIN role
    let isAdmin = false;
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });
        isAdmin = user?.role === "ADMIN";
        console.log(`[ADMIN_DEBUG] User ${session.user.email} role: ${user?.role}, isAdmin: ${isAdmin}, path: ${path}`);

        // Logged in but NOT admin → redirect to site home
        if (!isAdmin && !isPublicPage) {
            console.log(`[ADMIN_DEBUG] Non-admin user ${session.user.email} attempted to access ${path}. Redirecting home.`);
            redirect("/");
        }
    }

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 selection:bg-indigo-500/30">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="container mx-auto flex min-h-[5rem] items-center justify-between gap-3 px-4 pt-2">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                            <SignalTagLogo size={72} className="h-[72px] w-auto shrink-0" />
                            <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                                ReachMasked <span className="text-indigo-400 font-medium">Command</span>
                            </span>
                        </Link>

                        {isAdmin && (
                            <nav className="hidden md:flex items-center gap-1">
                                <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" />
                                <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />} label="Users" />
                                <NavLink href="/admin/tags" icon={<QrCode className="h-4 w-4" />} label="Tags" />
                                <NavLink href="/admin/stickers" icon={<Printer className="h-4 w-4" />} label="Stickers" />
                                <NavLink href="/admin/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
                                <NavLink href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {session?.user && (
                            <>
                                <div className="hidden sm:block text-right">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                                    <p className="text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{session.user.email}</p>
                                </div>
                                <form action={async () => {
                                    "use server";
                                    const { signOut } = await import("@/lib/auth");
                                    await signOut({ redirectTo: "/admin/login" });
                                }}>
                                    <Button variant="ghost" size="icon" type="submit" className="text-slate-400 hover:text-white hover:bg-white/5">
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href}>
            <Button variant="ghost" className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 font-medium px-4">
                {icon}
                {label}
            </Button>
        </Link>
    );
}
