import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSessionFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate Stripe Checkout Session
        const stripeSession = await stripe.checkout.sessions.create({
            customer: user.stripeCustomerId || undefined,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: process.env.STRIPE_STANDARD_PRICE_ID || "price_placeholder_123",
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://reachmasked.com"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://reachmasked.com"}/payment-cancel`,
            metadata: {
                userId: user.id,
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                },
            },
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[MOBILE_PURCHASE_SESSION]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
