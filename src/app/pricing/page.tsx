import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowLeft } from "lucide-react";
import { SignalTagLogo } from "@/components/signal-tag-logo";
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
                        <SignalTagLogo size={28} className="h-7 w-auto" />
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
                        Protect your vehicle&apos;s privacy with comprehensive notification features and masked contact relay.
                    </p>
                </div>

                <div className="flex justify-center w-full max-w-5xl">
                    <Card className="flex flex-col border-primary/50 bg-primary/5 relative shadow-xl max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="text-3xl text-primary text-center">Standard Plan</CardTitle>
                            <CardDescription className="text-center text-md mt-2">Comprehensive privacy and instant alerts for any asset.</CardDescription>

                            <div className="mt-6 flex flex-col items-center">
                                <div className="flex items-baseline text-6xl font-extrabold text-foreground">
                                    $24.99
                                </div>
                                <span className="mt-2 text-lg font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">one-time activation</span>
                                <p className="text-sm text-muted-foreground mt-3 font-medium text-center">Includes your physical Smart Tag &amp; first month of service.<br/>Then $4.99/mo starting after 30 days.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 mt-6">
                            <ul className="space-y-4">
                                {[
                                    "1 Universal Smart Tag (Vehicle, Pet, Property)",
                                    "Anonymous 2-Way Contact Relay",
                                    "Real-time In-App Alerts & Alarms",
                                    "Browser Push & Email Notifications",
                                    "Tag Ownership Control (Disable/Lock)",
                                    "Instant Scan History & Analytics"
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <div className="bg-primary/20 p-1 rounded-full">
                                            <Check className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-base font-medium text-foreground/90">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-6">
                            {session ? (
                                <StripeCheckoutButton
                                    className="w-full h-12 text-lg"
                                    priceId="price_1TDQFxCJ2dpZsFD0agN0OinK"
                                />
                            ) : (
                                <Link href="/register?redirect=/pricing" className="w-full">
                                    <Button className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all">
                                        Create Account to Subscribe
                                    </Button>
                                </Link>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
