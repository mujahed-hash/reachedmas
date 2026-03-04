"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { promoteToAdmin } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

export default function SetupAdminPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
    const router = useRouter();

    async function handleSetupAdmin(formData: FormData) {
        setLoading(true);
        const email = formData.get("email") as string;
        const res = await promoteToAdmin(email);
        setResult(res);
        setLoading(false);

        if (res.success) {
            setTimeout(() => {
                router.push("/"); // Back to admin overview
            }, 1500);
        }
    }

    return (
        <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center px-8 pt-8">
                    <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Lock className="h-10 w-10 text-indigo-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Security Escalation</CardTitle>
                    <CardDescription className="text-slate-400 mt-2">
                        Promote an account to Administrator status.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    {result?.success ? (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
                            <div className="space-y-1">
                                <p className="text-xl font-bold text-white">Access Granted</p>
                                <p className="text-sm text-slate-500">
                                    Command Center privileges enabled.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form action={handleSetupAdmin} className="space-y-6">
                            {result?.error && (
                                <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    {result.error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">
                                    Target Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@reachmasked.com"
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                />
                            </div>
                            <Button type="submit" className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all" disabled={loading}>
                                {loading ? "Authorizing..." : "Escalate to Admin"}
                            </Button>
                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
                                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                                    Note: This operation is restricted to accounts already possessing partial admin logic or if the system has zero active administrators.
                                </p>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
