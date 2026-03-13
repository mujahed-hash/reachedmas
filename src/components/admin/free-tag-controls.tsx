"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Gift, ShieldOff, Lock, Unlock, RefreshCw, Clock, AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import {
    grantFreeTag, revokeFreeTag, updateFreeTagSettings, adminForceLockTag, adminForceUnlockTag
} from "@/actions/admin/grant-free-tag";
import { type FreeTagStatus } from "@/lib/free-tag";

interface FreeTagControlsProps {
    userId: string;
    freeTagGranted: boolean;
    freeTagGrantedAt: Date | null;
    freeTagTrialDays: number;
    freeTagGraceDays: number;
    freeTagStatus: FreeTagStatus;
    daysRemaining: number;
    graceDaysRemaining: number;
}

const statusConfig = {
    ACTIVE:  { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2, label: "Active Trial" },
    GRACE:   { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",   icon: AlertTriangle, label: "Grace Period" },
    LOCKED:  { color: "bg-red-500/10 text-red-400 border-red-500/20",          icon: Lock,           label: "Locked" },
    NONE:    { color: "bg-slate-500/10 text-slate-400 border-slate-500/20",    icon: ShieldOff,      label: "Not Granted" },
};

export function FreeTagControls({
    userId, freeTagGranted, freeTagGrantedAt,
    freeTagTrialDays, freeTagGraceDays, freeTagStatus, daysRemaining, graceDaysRemaining
}: FreeTagControlsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [trialDays, setTrialDays] = useState(freeTagTrialDays);
    const [graceDays, setGraceDays] = useState(freeTagGraceDays);
    const [msg, setMsg] = useState<string | null>(null);

    const run = async (key: string, fn: () => Promise<{ success: boolean; message?: string }>) => {
        setLoading(key);
        setMsg(null);
        try {
            const res = await fn();
            if (res.message) setMsg(res.message);
        } finally {
            setLoading(null);
        }
    };

    const StatusIcon = statusConfig[freeTagStatus].icon;

    return (
        <Card className="border-white/10 bg-white/5">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Gift className="h-5 w-5 text-teal-400" />
                    Free Tag Grant
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                    <Badge className={`${statusConfig[freeTagStatus].color} flex items-center gap-1 px-3 py-1`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig[freeTagStatus].label}
                    </Badge>
                    {freeTagStatus === "ACTIVE" && (
                        <span className="text-sm text-slate-400">{daysRemaining} days remaining in trial</span>
                    )}
                    {freeTagStatus === "GRACE" && (
                        <span className="text-sm text-yellow-400">{graceDaysRemaining} grace days left before lock</span>
                    )}
                    {freeTagStatus === "LOCKED" && (
                        <span className="text-sm text-red-400">Locked — payment required to unlock</span>
                    )}
                </div>

                {freeTagGrantedAt && (
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Granted: {new Date(freeTagGrantedAt).toLocaleDateString()} ·
                        Trial ends: {new Date(new Date(freeTagGrantedAt).getTime() + freeTagTrialDays * 86400000).toLocaleDateString()} ·
                        Lock date: {new Date(new Date(freeTagGrantedAt).getTime() + (freeTagTrialDays + freeTagGraceDays) * 86400000).toLocaleDateString()}
                    </div>
                )}

                {/* Period Settings */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wide">Trial Days</Label>
                        <Input
                            type="number" min="1" max="365"
                            value={trialDays}
                            onChange={e => setTrialDays(Number(e.target.value))}
                            className="bg-black/20 border-white/10 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400 uppercase tracking-wide">Grace Days</Label>
                        <Input
                            type="number" min="0" max="30"
                            value={graceDays}
                            onChange={e => setGraceDays(Number(e.target.value))}
                            className="bg-black/20 border-white/10 text-white"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    {!freeTagGranted ? (
                        <Button
                            className="col-span-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold gap-2"
                            onClick={() => run("grant", () => grantFreeTag(userId, trialDays, graceDays))}
                            disabled={!!loading}
                        >
                            {loading === "grant" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                            Grant Free Tag
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="gap-2 border-white/10 text-slate-300 hover:text-white"
                                onClick={() => run("update", () => updateFreeTagSettings(userId, trialDays, graceDays))}
                                disabled={!!loading}
                            >
                                {loading === "update" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Update Periods
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => run("revoke", () => revokeFreeTag(userId))}
                                disabled={!!loading}
                            >
                                {loading === "revoke" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                                Revoke Grant
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => run("lock", () => adminForceLockTag(userId))}
                                disabled={!!loading}
                            >
                                {loading === "lock" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                Force Lock Now
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => run("unlock", () => adminForceUnlockTag(userId))}
                                disabled={!!loading}
                            >
                                {loading === "unlock" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                                Force Unlock
                            </Button>
                        </>
                    )}
                </div>

                {msg && (
                    <p className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-md px-3 py-2">
                        {msg}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
