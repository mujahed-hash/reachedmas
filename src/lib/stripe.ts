import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("Missing STRIPE_SECRET_KEY environment variable. Stripe checkout will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    // https://github.com/stripe/stripe-node#configuration
    // @ts-expect-error - Stripe type definition expects 2026-02-25.clover in this env
    apiVersion: "2025-02-24.acacia",
    appInfo: {
        name: "ReachMasked",
        url: "https://reachmasked.com",
    },
});
