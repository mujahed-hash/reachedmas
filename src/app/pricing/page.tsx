import { auth } from "@/lib/auth";
import Link from "next/link";
import { Check, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import StripeCheckoutButton from "@/components/stripe-checkout-button";

export default async function PricingPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground mr-1" />
                        <Shield className="h-6 w-6 text-primary" />
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            ReachMasked
                        </span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Protect your vehicle&apos;s privacy for free, or upgrade for premium notification features like Tow Prevention SMS.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
                    {/* Free Tier */}
                    <Card className="flex flex-col border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-2xl">Standard</CardTitle>
                            <CardDescription>Everything you need for basic vehicle privacy.</CardDescription>
                            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                                $0
                                <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {[
                                    "Unlimited Tag Generations",
                                    "Email Notifications",
                                    "Masked Contact Relay",
                                    "Dashboard Scan History",
                                    "Basic Analytics",
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-4 w-4 text-emerald-500" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href={session ? "/dashboard" : "/register"} className="w-full">
                                <Button className="w-full" variant="outline">
                                    {session ? "Current Plan" : "Get Started Free"}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Premium Tier */}
                    <Card className="flex flex-col border-primary/50 bg-primary/5 relative shadow-lg">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                            <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                                Recommended
                            </span>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">Premium</CardTitle>
                            <CardDescription>Advanced protection with instant SMS alerts.</CardDescription>
                            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                                $5
                                <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {[
                                    "Everything in Standard",
                                    "Instant SMS Notifications",
                                    "Tow Prevention Alerts",
                                    "Priority Email Support",
                                    "Custom Tag Labels",
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {session ? (
                                <StripeCheckoutButton
                                    className="w-full"
                                    priceId="price_placeholder_123"
                                />
                            ) : (
                                <Link href="/register?redirect=/pricing" className="w-full">
                                    <Button className="w-full">Create Account to Subscribe</Button>
                                </Link>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
