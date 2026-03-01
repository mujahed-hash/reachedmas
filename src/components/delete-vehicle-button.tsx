"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { deleteVehicle } from "@/app/actions/vehicle";

interface DeleteVehicleButtonProps {
    vehicleId: string;
    vehicleName: string;
}

export function DeleteVehicleButton({ vehicleId, vehicleName }: DeleteVehicleButtonProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleDelete() {
        setLoading(true);
        const result = await deleteVehicle(vehicleId);
        setLoading(false);

        if (result.success) {
            setOpen(false);
        } else {
            alert(result.message);
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Delete Vehicle</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        Are you sure you want to delete <strong>{vehicleName}</strong>? This will also delete all associated tags and scan history. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
