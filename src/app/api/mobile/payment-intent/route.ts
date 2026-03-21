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

        // 3. Create Subscription or Replacement PaymentIntent
        const body = await req.json().catch(() => ({}));
        const { type, assetId } = body;

        let clientSecret: string | null = null;

        if (type === "REPLACEMENT") {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: 1000, // $10.00
                currency: "usd",
                customer: customerId,
                automatic_payment_methods: { enabled: true },
                metadata: {
                    userId: user.id,
                    planType: "REPLACEMENT",
                    assetId: assetId || ""
                }
            });
            clientSecret = paymentIntent.client_secret;
        } else {
            // STANDARD_ANNUAL is now ONE_TIME_ACTIVATION + SUBSCRIPTION
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{
                    price: "price_1T8x47CJ2dpZsFD0yMv4UoCg", // $4.99/mo recurring
                }],
                trial_period_days: 30, // 30 days free, covers the first month
                add_invoice_items: [{
                    price: "price_1T8x43CJ2dpZsFD0nCXkS5h1", // $24.99 one-time (Tag + first month)
                }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId: user.id,
                }
            });

            const invoice = subscription.latest_invoice as any; // Cast to access expanded object
            clientSecret = invoice?.payment_intent?.client_secret;
        }

        if (!clientSecret) {
            throw new Error("Missing client_secret from Stripe");
        }

        return NextResponse.json({
            paymentIntent: clientSecret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        });

    } catch (error) {
        console.error("[MOBILE_PAYMENT_INTENT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
