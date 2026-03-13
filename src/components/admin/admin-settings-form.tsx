"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateSetting, getSettingValue, SETTING_DEFAULTS } from "@/actions/admin/system-settings";

interface SettingControl {
    key: string;
    label: string;
    type: "toggle" | "number" | "text";
    min?: number;
    max?: number;
    description?: string;
    danger?: boolean;
}

interface AdminSettingsFormProps {
    sectionId: string;
    controls: SettingControl[];
    settings: Record<string, string>;
}

export function AdminSettingsForm({ sectionId, controls, settings }: AdminSettingsFormProps) {
    const [pending, startTransition] = useTransition();
    const [values, setValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        for (const c of controls) {
            init[c.key] = settings[c.key] ?? SETTING_DEFAULTS[c.key] ?? "";
        }
        return init;
    });
    const [saved, setSaved] = useState<Record<string, boolean>>({});

    function handleToggle(key: string, on: boolean) {
        const val = on ? "true" : "false";
        setValues(v => ({ ...v, [key]: val }));
        startTransition(async () => {
            await updateSetting(key, val);
            setSaved(s => ({ ...s, [key]: true }));
            setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
        });
    }

    function handleSaveNumber(key: string) {
        startTransition(async () => {
            await updateSetting(key, values[key]);
            setSaved(s => ({ ...s, [key]: true }));
            setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
        });
    }

    return (
        <div className="space-y-4">
            {controls.map((ctrl) => (
                <div
                    key={ctrl.key}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        ctrl.danger
                            ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                    }`}
                >
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-white cursor-pointer">
                                {ctrl.label}
                            </Label>
                            {ctrl.danger && (
                                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] py-0">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                    Danger
                                </Badge>
                            )}
                            {saved[ctrl.key] && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0">
                                    Saved ✓
                                </Badge>
                            )}
                        </div>
                        {ctrl.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{ctrl.description}</p>
                        )}
                    </div>

                    {ctrl.type === "toggle" && (
                        <Switch
                            checked={values[ctrl.key] === "true"}
                            onCheckedChange={(on) => handleToggle(ctrl.key, on)}
                            disabled={pending}
                            className="data-[state=checked]:bg-teal-500"
                        />
                    )}

                    {ctrl.type === "number" && (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={ctrl.min}
                                max={ctrl.max}
                                value={values[ctrl.key]}
                                onChange={e => setValues(v => ({ ...v, [ctrl.key]: e.target.value }))}
                                className="w-24 bg-black/20 border-white/10 text-white text-center"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 text-slate-400 hover:text-white gap-1"
                                onClick={() => handleSaveNumber(ctrl.key)}
                                disabled={pending}
                            >
                                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
