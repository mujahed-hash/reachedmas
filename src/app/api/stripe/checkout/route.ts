import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const { priceId } = await req.json();

        // If the user already has a Stripe customer ID, use it.
        // Otherwise, Stripe will create one during checkout which we will catch in the webhook.
        const customer = user.stripeCustomerId;

        const stripeSession = await stripe.checkout.sessions.create({
            customer: customer || undefined,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId || "price_placeholder_123", // Should be replaced with actual Price ID from Stripe Dashboard
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
            metadata: {
                userId: user.id, // Very important: links Stripe back to our DB
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                },
            },
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
