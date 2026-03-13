import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import { generateQRDataURL, getTagURL, getNFCPayload } from "@/lib/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Dog, Home, User, Package, Smartphone, QrCode } from "lucide-react";
import Image from "next/image";
import { CopyButton } from "@/components/copy-button";
import { DownloadQRButton } from "@/components/download-qr-button";
import { StickerCard } from "@/components/admin/sticker-card";

const BASE_URL = process.env.NEXTAUTH_URL || "https://reachmasked.com";

const typeIcons: Record<string, any> = {
    CAR: Car, PET: Dog, HOME: Home, PERSON: User, ASSET: Package,
};

async function getTagDetails(tagId: string, userId: string) {
    const tag = await prisma.tag.findFirst({
        where: {
            id: tagId,
            asset: {
                ownerId: userId,
            },
        },
        include: {
            asset: true,
            _count: {
                select: { interactions: true },
            },
        },
    });

    return tag;
}

export default async function TagDetailsPage({
    params,
}: {
    params: Promise<{ tagId: string }>;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const { tagId } = await params;
    const tag = await getTagDetails(tagId, session.user.id);

    if (!tag) {
        notFound();
    }

    const qrDataURL = await generateQRDataURL(tag.shortCode);
    const tagURL = getTagURL(tag.shortCode);
    const nfcPayload = getNFCPayload(tag.shortCode);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header variant="dashboard" session={session} />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Asset Info */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            {(() => { const I = typeIcons[tag.asset.type] || Package; return <I className="h-6 w-6 text-primary" />; })()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {tag.asset.name}{tag.asset.subtitle ? ` · ${tag.asset.subtitle}` : ""}
                            </h1>
                            <p className="text-muted-foreground">Tag Code: {tag.shortCode}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* QR Code Card */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-primary" />
                                QR Code
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center p-4 bg-white rounded-xl">
                                <Image
                                    src={qrDataURL}
                                    alt={`QR Code for ${tag.shortCode}`}
                                    className="w-48 h-48"
                                    width={192}
                                    height={192}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Print this QR code and attach it to your asset
                            </p>
                            <DownloadQRButton shortCode={tag.shortCode} qrDataURL={qrDataURL} />
                        </CardContent>
                    </Card>

                    {/* NFC & URL Card */}
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-primary" />
                                NFC & URL
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Tag URL */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Tag URL</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-3 bg-muted rounded-lg text-sm text-foreground break-all">
                                        {tagURL}
                                    </code>
                                    <CopyButton text={tagURL} />
                                </div>
                            </div>

                            {/* NFC Payload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">NFC Payload</label>
                                <div className="p-3 bg-muted rounded-lg">
                                    <code className="text-sm text-foreground break-all">{nfcPayload}</code>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Program this URL onto an NTAG213/215 NFC tag. No encrypted data needed.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Printable Sticker Section */}
                <Card className="mt-6 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Printable Sticker Card
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-xl">
                            <div className="scale-90 md:scale-100 origin-center">
                                <StickerCard 
                                    shortCode={tag.shortCode}
                                    assetName={tag.asset.name}
                                    assetType={tag.asset.type}
                                    tagUrl={`${BASE_URL}/t/${tag.shortCode}`}
                                    qrDataUrl={qrDataURL}
                                />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            Download this premium sticker design for your vehicle or asset. 
                            It supports both <strong>QR Scan</strong> and <strong>NFC Tap</strong>.
                        </p>
                    </CardContent>
                </Card>

                {/* NFC Instructions */}
                <Card className="mt-6 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-foreground">NFC Setup Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-foreground">Recommended Tags</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>NTAG213 or NTAG215</li>
                                    <li>Weatherproof sticker or keyfob</li>
                                    <li>No special app required</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-foreground">How to Program</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use any NFC writer app (NFC Tools, etc.)</li>
                                    <li>Write the URL above as an NDEF record</li>
                                    <li>Place tag on your asset (dashboard, collar, door, etc.)</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-foreground">
                                <strong>Privacy Safe:</strong> The NFC tag only stores a URL. No phone numbers, personal data, or encrypted keys are stored on the chip.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
