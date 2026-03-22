"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { SignalTagLogo } from "@/components/signal-tag-logo";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
        // If successful, the server action handles redirect
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground selection:bg-primary/20">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <SignalTagLogo size={28} className="h-7 w-auto" />
                    <span className="text-lg font-bold tracking-tight text-foreground">ReachMasked</span>
                </Link>
            </div>

            <Card className="w-full max-w-sm border-border bg-card backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Enter your credentials to access your dashboard
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
