import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { ContactActions } from "@/components/contact-actions";
import { checkRateLimit, hashIP, rateLimitConfigs } from "@/lib/rate-limit";

interface VehicleData {
    tag: { publicId: string; shortCode: string };
    vehicle: { publicId: string; alias: string; towPreventionMode: boolean };
    rateLimited?: boolean;
}

async function getTagData(shortCode: string): Promise<VehicleData | null> {
    try {
        // Get IP for rate limiting and logging
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
        const ipHash = hashIP(ip);
        const userAgent = headersList.get("user-agent") || undefined;

        // Check rate limit for scan views
        const rateLimit = checkRateLimit(
            `scan:${ipHash}:${shortCode}`,
            rateLimitConfigs.scan
        );

        if (rateLimit.limited) {
            return {
                tag: { publicId: "", shortCode },
                vehicle: { publicId: "", alias: "", towPreventionMode: false },
                rateLimited: true
            };
        }

        const tag = await prisma.tag.findUnique({
            where: { shortCode },
            include: {
                vehicle: {
                    select: {
                        publicId: true,
                        model: true,
                        color: true,
                        isActive: true,
                        towPreventionMode: true,
                    },
                },
            },
        });

        if (!tag || tag.status !== "ACTIVE" || !tag.vehicle.isActive) {
            return null;
        }

        // Log the scan with IP hash and user agent
        await prisma.interaction.create({
            data: {
                tagId: tag.id,
                actionType: "SCAN_VIEW",
                ipHash: ipHash,
                userAgent: userAgent,
            },
        });

        return {
            tag: { publicId: tag.publicId, shortCode: tag.shortCode },
            vehicle: {
                publicId: tag.vehicle.publicId,
                alias: `${tag.vehicle.color} ${tag.vehicle.model}`,
                towPreventionMode: tag.vehicle.towPreventionMode,
            },
        };
    } catch (error) {
        console.error("Error fetching tag:", error);
        return null;
    }
}


export default async function ScanPage({
    params,
}: {
    params: Promise<{ shortCode: string }>;
}) {
    const { shortCode } = await params;
    const data = await getTagData(shortCode);

    if (!data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
                <Card className="w-full max-w-md border-destructive/20 bg-destructive/5 backdrop-blur-xl">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <h1 className="text-2xl font-bold text-foreground">Tag Not Found</h1>
                        <p className="text-muted-foreground">
                            This tag is either invalid or has been deactivated by the owner.
                        </p>
                        <Link href="/">
                            <Button variant="outline" className="mt-4 border-border bg-card text-foreground">
                                Go to Homepage
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Rate limited state
    if (data.rateLimited) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
                <Card className="w-full max-w-md border-amber-500/20 bg-amber-500/5 backdrop-blur-xl">
                    <CardContent className="p-8 text-center space-y-4">
                        <Clock className="h-12 w-12 text-amber-500 mx-auto" />
                        <h1 className="text-2xl font-bold text-foreground">Please Wait</h1>
                        <p className="text-muted-foreground">
                            Too many requests from your location. Please try again in a few minutes.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            This limit helps prevent abuse and protects vehicle owners.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">

            {/* Safety Header */}
            <div className="mb-8 flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-medium">Verified ReachMasked Vehicle</span>
            </div>

            <Card className="w-full max-w-md border-border bg-card backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                        <Car className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {data.vehicle.alias}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Tag #{data.tag.shortCode}
                    </p>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <ContactActions
                        tagPublicId={data.tag.publicId}
                        towPreventionMode={data.vehicle.towPreventionMode}
                    />

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Scanning this tag connects you to the owner via a secure relay.
                            <span className="text-foreground font-medium"> Your phone number is never revealed.</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8">
                <Link href="/">
                    <Button variant="link" className="text-muted-foreground hover:text-foreground">
                        What is ReachMasked?
                    </Button>
                </Link>
            </div>
        </div>
    );
}
