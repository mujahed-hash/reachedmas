"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    promoteToAdmin,
    demoteFromAdmin,
    deleteUser,
    updateUserPlan,
    resetUserPassword,
} from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ShieldCheck, ShieldOff, Trash2, Loader2, Star, StarOff, User as UserIcon, KeyRound } from "lucide-react";

interface UserActionsProps {
    userId: string;
    userEmail: string;
    currentRole: string;
    currentPlan: string;
    isCurrentUser: boolean;
}

export function UserActions({ userId, userEmail, currentRole, currentPlan, isCurrentUser }: UserActionsProps) {
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

    async function handleUpdatePlan(newPlan: "FREE" | "PREMIUM") {
        setLoading(true);
        setError(null);
        const result = await updateUserPlan(userId, newPlan);
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

    async function handleResetPassword() {
        if (!confirm(`Are you sure you want to reset the password for ${userEmail}? It will be reset to ReachAdminPassword123!`)) return;
        
        setLoading(true);
        setError(null);
        const result = await resetUserPassword(userId);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Failed to reset password");
        } else {
            alert(`Password successfully reset to: ReachAdminPassword123!`);
        }
    }

    if (isCurrentUser) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5">
                    <Link href={`/admin/users/${userId}`}>
                        <UserIcon className="h-4 w-4 mr-1" />
                        View Profile
                    </Link>
                </Button>
                <Badge variant="outline" className="text-muted-foreground">
                    You
                </Badge>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}

            <Button variant="outline" size="sm" asChild className="text-indigo-400 border-indigo-500/20 bg-indigo-500/5">
                <Link href={`/admin/users/${userId}`}>
                    <UserIcon className="h-4 w-4 mr-1" />
                    View Profile
                </Link>
            </Button>

            {currentPlan === "PREMIUM" ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePlan("FREE")}
                    disabled={loading}
                    className="text-slate-400 hover:text-white border-white/10"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <StarOff className="h-4 w-4 mr-1" />
                            Set Free
                        </>
                    )}
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePlan("PREMIUM")}
                    disabled={loading}
                    className="text-yellow-500 hover:text-yellow-600 border-yellow-500/20 bg-yellow-500/5"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Star className="h-4 w-4 mr-1 shadow-sm" />
                            To Premium
                        </>
                    )}
                </Button>
            )}

            {currentRole === "ADMIN" ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDemote}
                    disabled={loading}
                    className="text-orange-500 hover:text-orange-600 border-orange-500/20 bg-orange-500/5"
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
                    className="text-emerald-500 hover:text-emerald-600 border-emerald-500/20 bg-emerald-500/5"
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

            <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                disabled={loading}
                className="text-blue-500 hover:text-blue-600 border-blue-500/20 bg-blue-500/5"
                title="Reset Password to ReachAdminPassword123!"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <KeyRound className="h-4 w-4 mr-1" />
                        Reset Pass
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
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete <strong>{userEmail}</strong>?
                            This will also delete all their vehicles, tags, and notifications.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
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
