"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateTagStatus, deleteTag } from "@/app/actions/admin";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Loader2, MoreHorizontal, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface TagActionsProps {
    tagId: string;
    shortCode: string;
    currentStatus: string;
}

export function TagActions({ tagId, shortCode, currentStatus }: TagActionsProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleStatusChange(status: "ACTIVE" | "DISABLED" | "FLAGGED") {
        setLoading(true);
        setError(null);
        const result = await updateTagStatus(tagId, status);
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
        const result = await deleteTag(tagId);
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

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {currentStatus !== "ACTIVE" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Set Active
                        </DropdownMenuItem>
                    )}
                    {currentStatus !== "DISABLED" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("DISABLED")}>
                            <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                            Disable
                        </DropdownMenuItem>
                    )}
                    {currentStatus !== "FLAGGED" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("FLAGGED")}>
                            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                            Flag for Review
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        disabled={loading}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete tag <strong>{shortCode}</strong>?
                            This will also delete all scan history for this tag.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete Tag
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export function TagStatusBadge({ status }: { status: string }) {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; className: string }> = {
        ACTIVE: { variant: "default", className: "bg-green-500/10 text-green-500 border-green-500/20" },
        DISABLED: { variant: "secondary", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
        FLAGGED: { variant: "destructive", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    };

    const config = variants[status] || variants.ACTIVE;

    return (
        <Badge variant="outline" className={config.className}>
            {status}
        </Badge>
    );
}
