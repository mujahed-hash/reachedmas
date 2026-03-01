"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function StripeCheckoutButton({
    priceId,
    className
}: {
    priceId: string;
    className?: string;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("No checkout URL returned", data);
            }
        } catch (error) {
            console.error("Error creating checkout session", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            className={className}
            onClick={handleCheckout}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                </>
            ) : (
                "Upgrade to Premium"
            )}
        </Button>
    );
}
