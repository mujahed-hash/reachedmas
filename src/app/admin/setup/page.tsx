"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
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
                router.push("/admin");
            }, 1500);
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl">Admin Setup</CardTitle>
                    <CardDescription>
                        Enter your email to become the first admin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {result?.success ? (
                        <div className="text-center py-4">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-medium text-foreground">
                                Admin access granted!
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Redirecting to admin panel...
                            </p>
                        </div>
                    ) : (
                        <form action={handleSetupAdmin} className="space-y-4">
                            {result?.error && (
                                <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {result.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Your Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Setting up..." : "Make Me Admin"}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                This only works if no admins exist yet, or if you&apos;re already an admin.
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
