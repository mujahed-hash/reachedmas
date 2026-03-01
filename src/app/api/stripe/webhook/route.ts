import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: Error | unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[WEBHOOK_ERROR]", message);
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session?.metadata?.userId) {
            return new NextResponse("User ID is required", { status: 400 });
        }

        await prisma.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                plan: "PREMIUM",
            },
        });
    }

    if (event.type === "invoice.payment_succeeded") {
        // Find subscription by session.subscription if needed

        // Update the plan status or handle successful recurring payments here
        // If they already have PREMIUM, nothing major changes unless we track billing periods
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = await stripe.subscriptions.retrieve(
            session.id as string // The object here is the subscription itself
        );

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            // Find user by subscription ID
            const user = await prisma.user.findUnique({
                where: { stripeSubscriptionId: subscription.id }
            });

            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { plan: "FREE" }
                });
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
