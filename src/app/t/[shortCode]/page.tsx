import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertCircle, Clock, Car, Dog, Home, User, Package } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { ContactActions } from "@/components/contact-actions";
import { checkRateLimit, hashIP, rateLimitConfigs } from "@/lib/rate-limit";

const typeConfig: Record<string, { icon: any; label: string; verifiedLabel: string }> = {
    CAR: { icon: Car, label: "Vehicle", verifiedLabel: "Verified ReachMasked Vehicle" },
    PET: { icon: Dog, label: "Pet", verifiedLabel: "Verified ReachMasked Pet Tag" },
    HOME: { icon: Home, label: "Home", verifiedLabel: "Verified ReachMasked Home" },
    PERSON: { icon: User, label: "Person", verifiedLabel: "Verified ReachMasked ID" },
    ASSET: { icon: Package, label: "Asset", verifiedLabel: "Verified ReachMasked Asset" },
};

interface AssetData {
    tag: { publicId: string; shortCode: string };
    asset: { publicId: string; alias: string; type: string; towPreventionMode: boolean };
    rateLimited?: boolean;
}

async function getTagData(shortCode: string): Promise<AssetData | null> {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
        const ipHash = hashIP(ip);
        const userAgent = headersList.get("user-agent") || undefined;

        const rateLimit = checkRateLimit(
            `scan:${ipHash}:${shortCode}`,
            rateLimitConfigs.scan
        );

        if (rateLimit.limited) {
            return {
                tag: { publicId: "", shortCode },
                asset: { publicId: "", alias: "", type: "CAR", towPreventionMode: false },
                rateLimited: true
            };
        }

        const tag = await prisma.tag.findUnique({
            where: { shortCode },
            include: {
                asset: {
                    select: {
                        publicId: true,
                        type: true,
                        name: true,
                        subtitle: true,
                        isActive: true,
                        towPreventionMode: true,
                    },
                },
            },
        });

        if (!tag || tag.status !== "ACTIVE" || !tag.asset.isActive) {
            return null;
        }

        // Log the scan
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
            asset: {
                publicId: tag.asset.publicId,
                alias: tag.asset.name + (tag.asset.subtitle ? ` · ${tag.asset.subtitle}` : ""),
                type: tag.asset.type,
                towPreventionMode: tag.asset.towPreventionMode,
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
                    </CardContent>
                </Card>
            </div>
        );
    }

    const assetType = data.asset.type || "CAR";
    const config = typeConfig[assetType] || typeConfig.CAR;
    const IconComponent = config.icon;

    // Type-specific privacy message
    const privacyMessages: Record<string, string> = {
        CAR: "Scanning this tag connects you to the owner via a secure relay. Your phone number is never revealed.",
        PET: "This pet has a ReachMasked tag. Contact the owner securely — your identity stays private.",
        HOME: "This home uses ReachMasked for secure communication. Leave a message or notify the resident.",
        PERSON: "This person uses ReachMasked for private contact. Send a message securely.",
        ASSET: "This item is protected by ReachMasked. Contact the owner securely.",
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">

            {/* Safety Header */}
            <div className="mb-8 flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-medium">{config.verifiedLabel}</span>
            </div>

            <Card className="w-full max-w-md border-border bg-card backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                        <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {data.asset.alias}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Tag #{data.tag.shortCode}
                    </p>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <ContactActions
                        tagPublicId={data.tag.publicId}
                        towPreventionMode={data.asset.towPreventionMode}
                        assetType={assetType}
                    />

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            {privacyMessages[assetType]}
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
