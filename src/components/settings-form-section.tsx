"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FormSectionProps {
    title: string;
    description: string;
    action: (formData: FormData) => Promise<{ success: boolean; message: string }>;
    children: React.ReactNode;
    submitLabel?: string;
}

export function SettingsFormSection({
    title,
    description,
    action,
    children,
    submitLabel = "Save Changes",
}: FormSectionProps) {
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        setMessage(null);
        startTransition(async () => {
            const result = await action(formData);
            setMessage({ type: result.success ? "success" : "error", text: result.message });
        });
    }

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <CardTitle className="text-foreground text-lg">{title}</CardTitle>
                <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    {children}
                    {message && (
                        <div
                            className={`flex items-center gap-2 rounded-lg p-3 text-sm ${message.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                            ) : (
                                <AlertCircle className="h-4 w-4 shrink-0" />
                            )}
                            {message.text}
                        </div>
                    )}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {submitLabel}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ──────────────────────────────────────
// Notification toggle switch
// ──────────────────────────────────────
interface ToggleProps {
    name: string;
    label: string;
    description: string;
    defaultChecked?: boolean;
}

export function NotifToggle({ name, label, description, defaultChecked }: ToggleProps) {
    const [checked, setChecked] = useState(defaultChecked ?? false);

    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
                <input
                    type="checkbox"
                    name={name}
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
                <div
                    className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""
                        }`}
                />
            </label>
        </div>
    );
}
