import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSessionFromRequest } from "@/lib/mobile-auth";

export async function POST(req: Request) {
    try {
        const session = await getSessionFromRequest(req as any);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, stripeCustomerId: true }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 1. Find or create Stripe Customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id }
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId }
            });
        }

        // 2. Create Ephemeral Key for the Payment Sheet
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: "2025-02-24.acacia" } // Should match the stripe-node version
        );

        // 3. Create PaymentIntent
        // Amount in cents: $24.99 = 2499
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2499,
            currency: "usd",
            customer: customerId,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: user.id,
                planType: "STANDARD_ANNUAL"
            }
        });

        return NextResponse.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        });

    } catch (error) {
        console.error("[MOBILE_PAYMENT_INTENT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
