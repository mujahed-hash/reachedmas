import { ArrowLeft } from "lucide-react";
import { SignalTagLogo } from "@/components/signal-tag-logo";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata = {
    title: "Privacy Policy – ReachMasked",
    description: "How ReachMasked protects your personal data and privacy.",
};

export default function PrivacyPage() {
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
                        <SignalTagLogo size={24} className="h-6 w-auto" />
                        <span className="font-bold text-foreground">ReachMasked</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-3xl prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
                <h1>Privacy Policy</h1>
                <p className="text-sm text-muted-foreground">Last updated: February 27, 2026</p>

                <h2>1. What We Collect</h2>
                <p>
                    <strong>Account data:</strong> Email address, hashed password, and optionally your name and phone number.
                </p>
                <p>
                    <strong>Phone numbers:</strong> If you provide a phone number, it is encrypted using <strong>AES-256-GCM</strong> before storage. We never store your phone number in plain text.
                </p>
                <p>
                    <strong>Scan data:</strong> When someone scans your tag, we log a one-way hash of their IP address (not the IP itself), browser user-agent, and an approximate city derived from their IP (e.g., &ldquo;Austin, TX&rdquo;). We do <strong>not</strong> store GPS coordinates or precise location.
                </p>

                <h2>2. How We Use Your Data</h2>
                <ul>
                    <li>To notify you when someone scans your vehicle tag.</li>
                    <li>To relay messages and calls without revealing either party&apos;s identity.</li>
                    <li>To enforce rate limits and prevent abuse.</li>
                    <li>To send you account-related emails (password resets, security alerts).</li>
                </ul>
                <p>We <strong>never</strong> sell your data, share it with advertisers, or use it for profiling.</p>

                <h2>3. Data Encryption</h2>
                <p>
                    Phone numbers are encrypted with AES-256-GCM using a server-side key. Passwords are hashed with <strong>bcrypt</strong> (12 rounds). All traffic is encrypted over HTTPS/TLS.
                </p>

                <h2>4. Third-Party Services</h2>
                <ul>
                    <li><strong>Twilio</strong> — SMS and voice relay (when SMS notifications are enabled).</li>
                    <li><strong>Resend</strong> — Transactional email delivery.</li>
                    <li><strong>AWS</strong> — Infrastructure hosting (EC2, RDS).</li>
                </ul>
                <p>These providers process data under their own privacy policies as data processors on our behalf.</p>

                <h2>5. Data Retention</h2>
                <p>
                    <strong>Interaction logs</strong> are retained for 90 days, then purged automatically.
                    <strong>Account data</strong> persists until you delete your account.
                    <strong>IP hashes</strong> are non-reversible; the original IP cannot be recovered.
                </p>

                <h2>6. Your Rights</h2>
                <ul>
                    <li><strong>Access:</strong> Request a copy of your data from the Settings page.</li>
                    <li><strong>Delete:</strong> Delete your account and all associated data at any time.</li>
                    <li><strong>Portability:</strong> Export your vehicle and tag data as JSON.</li>
                </ul>

                <h2>7. Contact</h2>
                <p>
                    Questions about privacy? Email us at{" "}
                    <a href="mailto:privacy@reachmasked.com">privacy@reachmasked.com</a>.
                </p>
            </main>
        </div>
    );
}
