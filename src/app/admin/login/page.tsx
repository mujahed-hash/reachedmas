"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { SignalTagLogo } from "@/components/signal-tag-logo";
import Link from "next/link";
import { adminLogin } from "@/app/actions/auth";

export default function AdminLoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await adminLogin(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B1120] p-4 text-white selection:bg-indigo-500/30">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <SignalTagLogo size={28} className="h-7 w-auto" />
                    <span className="text-lg font-bold tracking-tight">ReachMasked <span className="text-indigo-400 font-medium">Admin</span></span>
                </Link>
            </div>

            <Card className="w-full max-w-sm border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                        <Lock className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-slate-400">
                        Authorized access only. Use your administrator credentials.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@reachmasked.com"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" throws-error="true" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Login to Command Center"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-8 text-slate-500 text-xs text-center w-full">
                © {new Date().getFullYear()} ReachMasked Security. All rights reserved.
            </div>
        </div>
    );
}
