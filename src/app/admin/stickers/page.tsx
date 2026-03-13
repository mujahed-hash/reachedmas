import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, QrCode } from "lucide-react";
import { StickerCard } from "@/components/admin/sticker-card";

async function getTagsForStickers() {
    return prisma.tag.findMany({
        where: { status: "ACTIVE" },
        include: {
            asset: {
                select: { name: true, type: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

const BASE_URL = process.env.NEXTAUTH_URL || "https://reachmasked.com";

export default async function AdminStickersPage() {
    const tags = await getTagsForStickers();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Sticker Generator</h1>
                        <p className="text-slate-500 mt-1">
                            Download print-ready stickers for each active tag — supports QR scan & NFC tap
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 py-1 px-3">
                        {tags.length} active tags
                    </Badge>
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 py-1 px-3">
                        <Printer className="h-3 w-3 mr-1" />
                        Print Ready
                    </Badge>
                </div>
            </div>

            {/* Info Banner */}
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 flex items-start gap-3">
                <QrCode className="h-5 w-5 text-teal-400 mt-0.5 shrink-0" />
                <div className="text-sm text-slate-300">
                    <span className="font-semibold text-teal-400">How it works:</span> Each sticker contains a QR code
                    that links to <code className="text-teal-300">reachmasked.com/t/[shortCode]</code>.
                    The same URL is embedded as NFC payload on physical NFC tags —
                    so both <strong>Scan</strong> (camera) and <strong>Tap</strong> (NFC) land on the same page.
                    Download the PNG and send to any print shop (3.5" × 2" business card size recommended).
                </div>
            </div>

            {/* Sticker Grid */}
            {tags.length === 0 ? (
                <Card className="border-white/10 bg-white/5 text-center p-16">
                    <QrCode className="h-16 w-16 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 font-medium">No active tags found</p>
                    <p className="text-slate-600 text-sm mt-1">Only ACTIVE tags are shown here</p>
                </Card>
            ) : (
                <div className="grid gap-10 justify-items-center">
                    {tags.map((tag) => (
                        <Card key={tag.id} className="border-white/10 bg-white/5 backdrop-blur-sm w-full max-w-2xl">
                            <CardContent className="p-6">
                                {/* Tag Info Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <p className="text-white font-semibold">{tag.asset.name}</p>
                                        <p className="text-slate-500 text-sm uppercase tracking-wide">{tag.asset.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <code className="text-indigo-400 text-sm font-mono bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                                            {tag.shortCode}
                                        </code>
                                        <p className="text-slate-600 text-xs mt-1">Tag ID</p>
                                    </div>
                                </div>

                                {/* Sticker Preview + Download */}
                                <div className="flex justify-center overflow-x-auto">
                                    <StickerCard
                                        shortCode={tag.shortCode}
                                        assetName={tag.asset.name}
                                        assetType={tag.asset.type}
                                        tagUrl={`${BASE_URL}/t/${tag.shortCode}`}
                                    />
                                </div>

                                {/* NFC Tip */}
                                <p className="text-center text-xs text-slate-600 mt-3">
                                    NFC payload URL: <code className="text-slate-400">{BASE_URL}/t/{tag.shortCode}</code>
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
