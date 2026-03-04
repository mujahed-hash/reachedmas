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
        <Card className="border-border bg-card hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted relative">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                            {asset.isShared && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-card" title="Shared with you" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{asset.name}</h3>
                                {asset.isShared && (
                                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                        Shared
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {asset.isShared ? (
                                    <span>Owner: {asset.owner?.name || asset.owner?.email.split('@')[0]} · </span>
                                ) : asset.subtitle ? (
                                    <span>{asset.subtitle} · </span>
                                ) : null}
                                {typeLabel} · {asset.tags.length} tag{asset.tags.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    {!asset.isShared && <DeleteVehicleButton vehicleId={asset.id} vehicleName={asset.name} />}
                </div>
                {firstTag && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Tag: {firstTag.shortCode}</span>
                        <div className="flex gap-2">
                            <Link href={`/dashboard/vehicles/${asset.id}`}>
                                <Button variant="outline" size="sm" className="text-xs">
                                    History
                                </Button>
                            </Link>
                            <Link href={`/dashboard/tags/${firstTag.id}`}>
                                <Button variant="outline" size="sm" className="text-xs">
                                    <QrCode className="h-3 w-3 mr-1" />
                                    QR Code
                                </Button>
                            </Link>
                            <Link href={`/t/${firstTag.shortCode}`}>
                                <Button variant="ghost" size="sm" className="text-xs">
                                    Preview
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
