"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteAssetAdmin, toggleVehicleActive } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
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
import { Trash2, Loader2, Power, PowerOff } from "lucide-react";

interface AssetActionsProps {
    assetId: string;
    assetName: string;
    isActive: boolean;
}

export function AssetActions({ assetId, assetName, isActive }: AssetActionsProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleToggle() {
        setLoading(true);
        setError(null);
        const result = await toggleVehicleActive(assetId);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Failed");
        } else {
            router.refresh();
        }
    }

    async function handleDelete() {
        setLoading(true);
        setError(null);
        const result = await deleteAssetAdmin(assetId);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Failed");
        } else {
            router.refresh();
        }
    }

    return (
        <div className="flex items-center gap-2">
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={handleToggle}
                disabled={loading}
                className={isActive ? "text-slate-400 border-white/10" : "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isActive ? (
                    <>
                        <PowerOff className="h-4 w-4 mr-1" />
                        Lock
                    </>
                ) : (
                    <>
                        <Power className="h-4 w-4 mr-1" />
                        Unlock
                    </>
                )}
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 border-red-500/20 bg-red-500/5"
                        disabled={loading}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete <strong>{assetName}</strong>?
                            This will also delete all tags associated with this asset.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete Asset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
