"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import { register } from "@/app/actions/auth";

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await register(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
        // If successful, the register server action throws a NEXT_REDIRECT — handled automatically
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground selection:bg-primary/20">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold tracking-tight text-foreground">ReachMasked</span>
                </Link>
            </div>

            <Card className="w-full max-w-sm border-border bg-card backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-foreground">Create an account</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Get your vehicle tags and start protecting your privacy
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
                            <Label htmlFor="name">Full Name <span className="text-muted-foreground">(optional)</span></Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Smith"
                                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                            />
                        </div>

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
                                minLength={8}
                                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                required
                                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                We&apos;ll alert you when someone contacts you about your vehicle. Your number is fully encrypted.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
