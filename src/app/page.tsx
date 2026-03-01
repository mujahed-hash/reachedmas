import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  QrCode,
  MessageSquare,
  Lock,
  Truck,
  Shield,
  ChevronRight,
  Phone,
  Eye,
  Zap,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <Header session={session} />

      <main className="flex-1">
        {/* ════════════════ Hero ════════════════ */}
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-20 pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-[128px]" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-500 rounded-full blur-[128px]" />
          </div>

          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                Now available in the US
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
                Contact without <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                  Compromise.
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
                The privacy-first vehicle tag. Notify owners about parking issues,
                lights left on, or emergencies{" "}
                <span className="text-foreground font-semibold">
                  without ever sharing your phone number.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]"
                  >
                    Get Your Tag
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base border-border bg-card/50 text-foreground hover:bg-accent"
                  >
                    Learn How it Works
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════ Feature Grid ════════════════ */}
        <section className="container mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<QrCode className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />}
              title="Instant Scan"
              description="No app required. Anyone can scan your vehicle's tag to notify you instantly."
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8 text-primary" />}
              title="100% Private"
              description="Your phone number is AES-256 encrypted. Calls and messages use a masked relay. Nobody sees your real number."
            />
            <FeatureCard
              icon={<Truck className="h-8 w-8 text-amber-500 dark:text-amber-400" />}
              title="Tow Prevention"
              description="Enable tow-prevention mode and get an urgent call + SMS before your car gets towed."
            />
          </div>
        </section>

        {/* ════════════════ How It Works ════════════════ */}
        <section id="how-it-works" className="py-24 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
                Three simple steps. No apps to download. Privacy built in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StepCard
                number="1"
                icon={<QrCode className="h-6 w-6" />}
                title="Place Your Tag"
                description="Stick the NFC/QR tag on your windshield or dashboard. Register it in 30 seconds."
              />
              <StepCard
                number="2"
                icon={<Eye className="h-6 w-6" />}
                title="Someone Scans"
                description="A neighbor, tow driver, or passerby scans the tag with their phone. No app needed."
              />
              <StepCard
                number="3"
                icon={<Phone className="h-6 w-6" />}
                title="You Get Notified"
                description="You receive an instant alert via email or SMS. Your auto-reply is shown to the scanner."
              />
            </div>
          </div>
        </section>

        {/* ════════════════ Pricing ════════════════ */}
        <section id="pricing" className="py-24 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Simple Pricing
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                One tag, full protection. No subscriptions required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Free Tier */}
              <Card className="border-border bg-card relative">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground">Starter</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">Free</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Get started with email notifications.
                  </p>
                  <ul className="mt-6 space-y-3">
                    <PricingItem>1 vehicle tag</PricingItem>
                    <PricingItem>Email notifications</PricingItem>
                    <PricingItem>Auto-reply messages</PricingItem>
                    <PricingItem>Scan history</PricingItem>
                  </ul>
                  <Link href="/register" className="mt-8 block">
                    <Button variant="outline" className="w-full">
                      Sign Up Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="border-primary/30 bg-primary/5 relative ring-1 ring-primary/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground">Pro</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">$4.99</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Full protection with SMS & voice relay.
                  </p>
                  <ul className="mt-6 space-y-3">
                    <PricingItem>Unlimited vehicle tags</PricingItem>
                    <PricingItem>SMS + voice masked relay</PricingItem>
                    <PricingItem>Tow-prevention mode</PricingItem>
                    <PricingItem>Priority emergency calls</PricingItem>
                    <PricingItem>NFC-enabled tags</PricingItem>
                  </ul>
                  <Link href="/register" className="mt-8 block">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ════════════════ FAQ ════════════════ */}
        <section id="faq" className="py-24 border-t border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <FaqItem
                q="Do scanners need to download an app?"
                a="No. Scanning uses the phone's built-in camera or NFC reader. It opens a web page instantly — no app, no account required."
              />
              <FaqItem
                q="Is my phone number safe?"
                a="Absolutely. Your phone number is encrypted with AES-256-GCM and stored securely. When someone contacts you, we relay the message through our servers. Neither party ever sees the other's real number."
              />
              <FaqItem
                q="What is tow-prevention mode?"
                a="When enabled, any tow operator who scans your tag triggers an urgent dual-channel alert — you get both an SMS and an automated phone call within seconds."
              />
              <FaqItem
                q="Can I disable my tag temporarily?"
                a="Yes. From your dashboard, you can disable any tag at any time. Disabled tags show a 'Tag Not Found' message to scanners."
              />
              <FaqItem
                q="What does the free plan include?"
                a="1 vehicle tag, email notifications for all contact events, auto-reply messages, and full scan history. Upgrade to Pro for SMS/voice relay and tow-prevention."
              />
            </div>
          </div>
        </section>
      </main>

      {/* ════════════════ Footer ════════════════ */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">ReachMasked</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <a href="#faq" className="hover:text-foreground transition-colors">
                FAQ
              </a>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ReachMasked. Privacy-first.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ──────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border bg-card backdrop-blur-sm transition-all hover:bg-accent hover:border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="p-3 w-fit rounded-xl bg-muted ring-1 ring-border">{icon}</div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, icon, title, description }: { number: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 text-primary">
        {icon}
      </div>
      <div className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Step {number}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
      {children}
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-5 transition-colors open:bg-accent/50">
      <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground">
        {q}
        <Zap className="h-4 w-4 text-muted-foreground group-open:text-primary transition-colors shrink-0 ml-4" />
      </summary>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
    </details>
  );
}
