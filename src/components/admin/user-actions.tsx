"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    promoteToAdmin,
    demoteFromAdmin,
    deleteUser,
} from "@/app/actions/admin";
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
import { ShieldCheck, ShieldOff, Trash2, Loader2 } from "lucide-react";

interface UserActionsProps {
    userId: string;
    userEmail: string;
    currentRole: string;
    isCurrentUser: boolean;
}

export function UserActions({ userId, userEmail, currentRole, isCurrentUser }: UserActionsProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handlePromote() {
        setLoading(true);
        setError(null);
        const result = await promoteToAdmin(userEmail);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Failed");
        } else {
            router.refresh();
        }
    }

    async function handleDemote() {
        setLoading(true);
        setError(null);
        const result = await demoteFromAdmin(userEmail);
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
        const result = await deleteUser(userId);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Failed");
        } else {
            router.refresh();
        }
    }

    if (isCurrentUser) {
        return (
            <Badge variant="outline" className="text-muted-foreground">
                You
            </Badge>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}

            {currentRole === "ADMIN" ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDemote}
                    disabled={loading}
                    className="text-orange-500 hover:text-orange-600"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Demote
                        </>
                    )}
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePromote}
                    disabled={loading}
                    className="text-green-500 hover:text-green-600"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Make Admin
                        </>
                    )}
                </Button>
            )}

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        disabled={loading}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{userEmail}</strong>?
                            This will also delete all their vehicles, tags, and notifications.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
