import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        // Guard: bail early with a clear message if Stripe isn't configured
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: "Payment system is not configured. Please contact support." },
                { status: 503 }
            );
        }

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { priceId } = await req.json();

        // If the user already has a Stripe customer ID, use it.
        // Otherwise, Stripe will create one during checkout which we will catch in the webhook.
        const customer = user.stripeCustomerId;

        // price_1T8x43CJ2dpZsFD0nCXkS5h1 = $24.99 one-time (Tag + first month)
        // price_1T8x47CJ2dpZsFD0yMv4UoCg = $4.99/mo recurring (starts after trial)
        const stripeSession = await stripe.checkout.sessions.create({
            customer: customer || undefined,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: "price_1T8x47CJ2dpZsFD0yMv4UoCg",
                    quantity: 1,
                },
                {
                    price: "price_1T8x43CJ2dpZsFD0nCXkS5h1",
                    quantity: 1,
                }
            ],
            subscription_data: {
                trial_period_days: 30, // 30 days free, covers the first month which was paid in the $24.99
                metadata: {
                    userId: user.id,
                },
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://reachmasked.com"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://reachmasked.com"}/pricing`,
            metadata: {
                userId: user.id,
            },
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return NextResponse.json(
            { error: "Failed to create checkout session. Please try again." },
            { status: 500 }
        );
    }
}
