"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertTriangle,
    Clock,
    MessageSquare,
    Phone,
    Truck,
    CheckCircle,
    Loader2,
    MessageCircle,
    Reply,
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { initiateContact, type ContactAction } from "@/app/actions/contact";

interface ContactActionsProps {
    tagPublicId: string;
    towPreventionMode?: boolean;
}

export function ContactActions({ tagPublicId, towPreventionMode }: ContactActionsProps) {
    const [loading, setLoading] = useState<ContactAction | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [autoReply, setAutoReply] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scannerMessage, setScannerMessage] = useState("");
    const [showMessageField, setShowMessageField] = useState(false);

    // Cloudflare Turnstile
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const handleAction = async (action: ContactAction) => {
        if (siteKey && !turnstileToken) {
            setError("Please complete the security check first.");
            return;
        }

        setLoading(action);
        setError(null);
        setSuccess(null);
        setAutoReply(null);

        const result = await initiateContact(
            tagPublicId,
            action,
            scannerMessage.trim() || undefined,
            turnstileToken || undefined
        );

        setLoading(null);
        if (result.success) {
            setSuccess(result.message);
            setAutoReply(result.autoReply ?? null);
        } else {
            setError(result.message);
        }
    };

    if (success) {
        return (
            <div className="space-y-4">
                <Card className="border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl">
                    <CardContent className="p-6 text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <h3 className="text-lg font-semibold text-foreground">
                            Message Sent!
                        </h3>
                        <p className="text-muted-foreground text-sm">{success}</p>
                        <Button
                            variant="outline"
                            className="border-border bg-card text-foreground"
                            onClick={() => {
                                setSuccess(null);
                                setAutoReply(null);
                                setScannerMessage("");
                                setShowMessageField(false);
                            }}
                        >
                            Send Another Message
                        </Button>
                    </CardContent>
                </Card>

                {autoReply && (
                    <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <Reply className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-foreground mb-1">
                                        Owner&apos;s Auto-Reply
                                    </p>
                                    <p className="text-sm text-muted-foreground italic">
                                        &ldquo;{autoReply}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Select an Issue
            </h3>

            {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
            )}

            {siteKey && (
                <div className="flex justify-center mb-1">
                    <Turnstile
                        siteKey={siteKey}
                        onSuccess={(token) => {
                            setTurnstileToken(token);
                            if (error === "Please complete the security check first.") {
                                setError(null);
                            }
                        }}
                        onError={() => setError("Security check failed. Please refresh.")}
                        options={{ theme: "auto" }}
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <ActionButton
                    icon={<MessageSquare className="h-5 w-5" />}
                    label="Blocking Driveway"
                    loading={loading === "blocking_driveway"}
                    disabled={loading !== null}
                    onClick={() => handleAction("blocking_driveway")}
                    colorClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                />
                <ActionButton
                    icon={<Clock className="h-5 w-5" />}
                    label="Parking Meter"
                    loading={loading === "parking_meter"}
                    disabled={loading !== null}
                    onClick={() => handleAction("parking_meter")}
                    colorClass="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
                />
                <ActionButton
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label="Lights On"
                    loading={loading === "lights_on"}
                    disabled={loading !== null}
                    onClick={() => handleAction("lights_on")}
                    colorClass="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                />
                <ActionButton
                    icon={<Phone className="h-5 w-5" />}
                    label="Emergency"
                    loading={loading === "emergency"}
                    disabled={loading !== null}
                    onClick={() => handleAction("emergency")}
                    colorClass="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20"
                />
            </div>

            {/* Tow Alert — full width, prominent CTA */}
            <ActionButton
                icon={<Truck className="h-5 w-5" />}
                label={towPreventionMode ? "⚡ Tow Alert (Owner Opted In)" : "Tow Alert"}
                loading={loading === "tow_alert"}
                disabled={loading !== null}
                onClick={() => handleAction("tow_alert")}
                colorClass="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                fullWidth
            />

            {/* Optional message toggle */}
            <div className="pt-1">
                {showMessageField ? (
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Add a note for the owner (optional, max 200 chars)"
                            maxLength={200}
                            value={scannerMessage}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScannerMessage(e.target.value)}
                            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none h-20"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                                {scannerMessage.length}/200
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground h-7"
                                onClick={() => {
                                    setShowMessageField(false);
                                    setScannerMessage("");
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                        onClick={() => setShowMessageField(true)}
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Add a note for the owner
                    </button>
                )}
            </div>
        </div>
    );
}

function ActionButton({
    icon,
    label,
    loading,
    disabled,
    onClick,
    colorClass,
    fullWidth,
}: {
    icon: React.ReactNode;
    label: string;
    loading: boolean;
    disabled: boolean;
    onClick: () => void;
    colorClass: string;
    fullWidth?: boolean;
}) {
    return (
        <button
            className={`flex ${fullWidth ? "w-full flex-row justify-center gap-3" : "flex-col gap-3"} items-center rounded-xl border p-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
            onClick={onClick}
            disabled={disabled}
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
