import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata = {
    title: "Terms of Service – ReachMasked",
    description: "Terms and conditions for using the ReachMasked platform.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                    <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Home</span>
                    </Link>
                    <Separator orientation="vertical" className="h-5" />
                    <Link href="/" className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">ReachMasked</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
                <h1>Terms of Service</h1>
                <p className="text-sm text-muted-foreground">Last updated: February 27, 2026</p>

                <h2>1. Agreement</h2>
                <p>
                    By creating an account or using ReachMasked (&ldquo;the Service&rdquo;), you agree to these Terms of Service.
                    If you do not agree, do not use the Service.
                </p>

                <h2>2. The Service</h2>
                <p>
                    ReachMasked provides privacy-preserving vehicle communication tags. Owners place a tag on their vehicle and receive
                    masked notifications when someone scans it. The Service relays messages and calls without revealing either party&apos;s
                    personal contact information.
                </p>

                <h2>3. Acceptable Use</h2>
                <p>You agree <strong>not</strong> to:</p>
                <ul>
                    <li>Use the Service for harassment, threats, or illegal activity.</li>
                    <li>Attempt to reverse-engineer, de-anonymize, or extract personal data of other users.</li>
                    <li>Abuse the contact system (e.g., spam, automated scanning, or flooding the relay).</li>
                    <li>Circumvent rate limits, CAPTCHA, or other abuse-prevention measures.</li>
                </ul>
                <p>
                    Violations may result in immediate account suspension or termination at our sole discretion.
                </p>

                <h2>4. Tags & Vehicles</h2>
                <p>
                    You are responsible for the accuracy of vehicle information you register. Tags are personal to your account and must
                    not be transferred without creating a new registration. We are not liable for misuse of tags placed on vehicles you
                    do not own.
                </p>

                <h2>5. Tow-Prevention Mode</h2>
                <p>
                    Tow-prevention mode sends a best-effort urgent notification to the vehicle owner. <strong>ReachMasked does not guarantee
                        that a tow will be prevented.</strong> The feature is an alert system, not a legal instrument. Always comply with local
                    parking laws and regulations.
                </p>

                <h2>6. Privacy</h2>
                <p>
                    Your use of the Service is also governed by our{" "}
                    <Link href="/privacy">Privacy Policy</Link>. By using ReachMasked you consent to the data practices described therein.
                </p>

                <h2>7. Disclaimers</h2>
                <p>
                    The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee uninterrupted service,
                    delivery of every notification, or prevention of towing. Our liability is limited to the amount you have paid us in the
                    12 months preceding any claim.
                </p>

                <h2>8. Changes</h2>
                <p>
                    We may update these Terms at any time. If the changes are material, we will notify you via email or an in-app notice.
                    Continued use after changes constitutes acceptance.
                </p>

                <h2>9. Contact</h2>
                <p>
                    Questions? Email us at{" "}
                    <a href="mailto:legal@reachmasked.com">legal@reachmasked.com</a>.
                </p>
            </main>
        </div>
    );
}
