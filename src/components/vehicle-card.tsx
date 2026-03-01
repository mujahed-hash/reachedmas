"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, QrCode } from "lucide-react";
import Link from "next/link";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";

interface VehicleCardProps {
    vehicle: {
        id: string;
        model: string;
        color: string;
        tags: { id: string; shortCode: string }[];
    };
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
    const firstTag = vehicle.tags[0];
    const vehicleName = `${vehicle.color} ${vehicle.model}`;

    return (
        <Card className="border-border bg-card hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted">
                            <Car className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{vehicleName}</h3>
                            <p className="text-sm text-muted-foreground">
                                {vehicle.tags.length} tag{vehicle.tags.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <DeleteVehicleButton vehicleId={vehicle.id} vehicleName={vehicleName} />
                </div>
                {firstTag && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Tag: {firstTag.shortCode}</span>
                        <div className="flex gap-2">
                            <Link href={`/dashboard/vehicles/${vehicle.id}`}>
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
