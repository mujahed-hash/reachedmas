"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SignalTagLogo } from "@/components/signal-tag-logo";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Session } from "next-auth";
import { useSession } from "next-auth/react";

import { Bell, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
    variant?: "default" | "dashboard";
    session?: Session | null;
    unreadCount?: number;
}

export function Header({ variant = "default", session, unreadCount = 0 }: HeaderProps) {
    const { data: clientSession, status } = useSession();
    const [scrolled, setScrolled] = useState(false);

    const activeSession = session || clientSession;
    const isLoading = status === "loading" && !session;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            key={activeSession?.user?.id || "logged-out"}
            className={cn(
                "sticky top-0 z-50 w-full transition-all duration-300",
                scrolled
                    ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-sm"
                    : "bg-transparent border-b border-transparent"
            )}
        >
            <div className="container mx-auto flex min-h-[5rem] items-center justify-between gap-3 px-4 pt-2">
                <Link href="/" className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-80">
                    <SignalTagLogo size={48} className="h-12 sm:h-16 md:h-[72px] w-auto shrink-0" />
                    <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
                        ReachMasked
                    </span>
                </Link>

                {isLoading ? (
                    <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
                ) : variant === "dashboard" && activeSession ? (
                    <nav className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden md:block mr-2">
                            {activeSession.user?.email}
                        </span>
                        <ThemeToggle />
                        <Link href="/notifications">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                                <Bell className="h-5 w-5" />
                                <span
                                    id="notification-badge"
                                    className={`absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ${unreadCount > 0 ? "" : "hidden"}`}
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            </Button>
                        </Link>
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </Link>
                        <form action={logout}>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </form>
                    </nav>
                ) : (
                    <nav className="flex items-center gap-2 sm:gap-4">
                        <ThemeToggle />
                        <Link href="/login">
                            <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                                Login
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]">
                                <span className="hidden sm:inline">Get Tags</span>
                                <span className="sm:hidden">Sign Up</span>
                            </Button>
                        </Link>
                    </nav>
                )}
            </div>
        </header>
    );
}
