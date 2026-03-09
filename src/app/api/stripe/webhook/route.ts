import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { generateShortCode } from "@/lib/utils";

export async function GET() {
    return new NextResponse("Stripe Webhook Endpoint (POST required)", { status: 200 });
}

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

    // 1. Handle Web Checkout (Subscriptions or One-time Payments)
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 });
        }

        const data: any = {
            plan: "PREMIUM",
            stripeCustomerId: session.customer as string,
        };

        // If it was a subscription, save the ID
        if (session.subscription) {
            data.stripeSubscriptionId = session.subscription as string;
        }

        await prisma.user.update({
            where: { id: userId },
            data,
        });
    }

    // 2. Handle Native Mobile Payments (PaymentIntents)
    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object as Stripe.PaymentIntent;
        const { userId, planType, assetId } = intent.metadata;

        if (!userId) return new NextResponse("User ID missing in metadata", { status: 400 });

        if (planType === "STANDARD_ANNUAL") {
            await prisma.user.update({
                where: { id: userId },
                data: { plan: "PREMIUM" },
            });
        }

        if (planType === "REPLACEMENT" && assetId) {
            // Disable old tags
            await prisma.tag.updateMany({
                where: { assetId: assetId },
                data: { status: "DISABLED" }
            });

            // Generate unique shortCode
            let shortCode = generateShortCode();
            let attempts = 0;
            while (attempts < 10) {
                const existing = await prisma.tag.findUnique({ where: { shortCode } });
                if (!existing) break;
                shortCode = generateShortCode();
                attempts++;
            }

            // Create new tag
            await prisma.tag.create({
                data: {
                    assetId: assetId,
                    shortCode,
                    status: "ACTIVE"
                }
            });
        }
    }

    // 3. Handle Subscription Deletion/Updates
    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
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
