import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { Shield, LayoutDashboard, Users, QrCode, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Detect if we're on a public admin page (login/setup)
    const headersList = await headers();
    const path = headersList.get("x-path") || "";
    const referer = headersList.get("referer") || "";

    // Check both x-path (reliable from middleware) and referer (fallback)
    const isPublicPage =
        path.includes("/login") ||
        path.includes("/setup") ||
        referer.includes("/login") ||
        referer.includes("/setup");

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

        // Logged in but NOT admin → block
        if (!isAdmin && !isPublicPage) {
            // SAFETY: Prevent loop
            if (!path.includes("login") && !path.includes("setup")) {
                redirect("/admin/login");
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 selection:bg-indigo-500/30">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                            <Shield className="h-6 w-6 text-indigo-500" />
                            <span className="text-lg font-bold tracking-tight text-white">
                                ReachMasked <span className="text-indigo-400 font-medium">Command</span>
                            </span>
                        </Link>

                        {isAdmin && (
                            <nav className="hidden md:flex items-center gap-1">
                                <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" />
                                <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />} label="Users" />
                                <NavLink href="/admin/tags" icon={<QrCode className="h-4 w-4" />} label="Tags" />
                                <NavLink href="/admin/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
                                <NavLink href="/admin/setup" icon={<Settings className="h-4 w-4" />} label="Setup" />
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
                                <Link href="/api/auth/signout">
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </Link>
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
