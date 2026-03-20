"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Dog, Home, User, Package, QrCode } from "lucide-react";
import Link from "next/link";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";

const typeIcons: Record<string, any> = {
    CAR: Car,
    PET: Dog,
    HOME: Home,
    PERSON: User,
    ASSET: Package,
};

interface AssetCardProps {
    asset: {
        id: string;
        type: string;
        name: string;
        subtitle?: string | null;
        tags: { id: string; shortCode: string }[];
        isShared?: boolean;
        owner?: { name: string | null; email: string };
    };
}

export function AssetCard({ asset }: AssetCardProps) {
    const firstTag = asset.tags[0];
    const Icon = typeIcons[asset.type] || Package;
    const typeLabel = asset.type.charAt(0) + asset.type.slice(1).toLowerCase();

    return (
        <Card className="rounded-[2rem] border-border bg-card hover:-translate-y-1 hover:shadow-2xl hover:border-primary/40 transition-all duration-500 ease-out group overflow-hidden relative">
            <CardContent className="p-8">
                {/* Header: Title and Status */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-foreground tracking-wide">{asset.name}</h3>
                            {asset.isShared && (
                                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                    Shared
                                </span>
                            )}
                        </div>
                        <p className="text-base text-muted-foreground flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {asset.isShared ? `Owner: ${asset.owner?.name || asset.owner?.email.split('@')[0]} · ` : (asset.subtitle ? `${asset.subtitle} · ` : "")}
                            {typeLabel}
                        </p>
                    </div>
                    {firstTag ? (
                        <div className="bg-[#10B981]/15 text-[#10B981] text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            Active
                        </div>
                    ) : (
                        <div className="bg-destructive/15 text-destructive text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                            No Tag
                        </div>
                    )}
                </div>

                {/* QR Code / Tag info */}
                {firstTag && (
                    <div className="flex items-center gap-5 mb-8 mt-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 dark:from-[#0F00FFD4] to-transparent flex items-center justify-center border border-primary/20 shadow-[inset_0_0_12px_rgba(33,19,255,0.15)] group-hover:from-primary/40 dark:group-hover:from-[#2113FF]/40 transition-colors duration-500">
                            <QrCode className="h-8 w-8 text-primary dark:text-[#6C60FF] group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Tag Code</p>
                            <p className="text-foreground font-bold text-lg tracking-wide">{firstTag.shortCode}</p>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/50">
                    <Link href={`/dashboard/assets/${asset.id}`} className="text-muted-foreground text-xs font-bold tracking-widest hover:text-foreground transition-colors uppercase">
                        View History
                    </Link>
                    <div className="flex items-center gap-3">
                        {!asset.isShared && <DeleteVehicleButton vehicleId={asset.id} vehicleName={asset.name} />}
                        {firstTag && (
                            <>
                                <Link href={`/t/${firstTag.shortCode}`}>
                                    <Button variant="ghost" size="sm" className="h-9 px-4 text-sm font-medium hover:bg-secondary/80 text-foreground transition-colors">
                                        Preview
                                    </Button>
                                </Link>
                                <Link href={`/dashboard/tags/${firstTag.id}`}>
                                    <Button variant="ghost" size="sm" className="h-9 px-4 text-sm font-bold bg-primary/10 hover:bg-primary/20 text-primary dark:text-[#95C8FF] hover:text-primary rounded-xl transition-colors">
                                        Options <span className="ml-1 opacity-70">&rarr;</span>
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
