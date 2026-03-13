import { getSettings } from "@/actions/admin/system-settings";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Gift, Shield, Bell, Zap, Users, Lock, Sliders } from "lucide-react";

export default async function AdminSettingsPage() {
    const settings = await getSettings();

    const sections = [
        {
            id: "free_tag",
            icon: Gift,
            color: "text-teal-400",
            title: "Free Tag Defaults",
            description: "Default trial and grace periods for new free tag grants.",
            controls: [
                { key: "free_tag.default_trial_days", label: "Default Trial Days", type: "number", min: 1, max: 365, description: "How many days a free tag trial lasts by default" },
                { key: "free_tag.default_grace_days", label: "Default Grace Days", type: "number", min: 0, max: 60, description: "Grace period before tag locks after trial ends" },
                { key: "free_tag.globally_enabled", label: "Free Tag Grants Enabled", type: "toggle", description: "Allow admins to grant free tags to users at all" },
            ],
        },
        {
            id: "scan",
            icon: Zap,
            color: "text-indigo-400",
            title: "Scan Behavior",
            description: "Control how the public tag scan page works.",
            controls: [
                { key: "scan.captcha_enabled", label: "CAPTCHA on Scan Page", type: "toggle", description: "Requires Cloudflare Turnstile to prevent bot scanning" },
                { key: "scan.anonymous_messages_enabled", label: "Anonymous Messages", type: "toggle", description: "Allow scanners to send anonymous messages to owners" },
                { key: "scan.require_message", label: "Require Message Text", type: "toggle", description: "Force scanner to write a message before submitting" },
            ],
        },
        {
            id: "notifications",
            icon: Bell,
            color: "text-orange-400",
            title: "Notifications",
            description: "Enable or disable notification channels globally.",
            controls: [
                { key: "notif.email_enabled", label: "Email Notifications", type: "toggle", description: "Send email alerts to owners on scan/contact" },
                { key: "notif.sms_enabled", label: "SMS Notifications", type: "toggle", description: "Send SMS alerts via Twilio" },
                { key: "notif.push_enabled", label: "Push Notifications", type: "toggle", description: "Send push notifications via Firebase FCM" },
            ],
        },
        {
            id: "tag_behavior",
            icon: Lock,
            color: "text-red-400",
            title: "Tag Behavior",
            description: "Control how tags behave on trial expiry.",
            controls: [
                { key: "tag.auto_lock_on_trial_expiry", label: "Auto-Lock on Trial Expiry", type: "toggle", description: "Automatically lock free tags when grace period ends" },
                { key: "tag.grace_period_enforcement", label: "Enforce Grace Period", type: "toggle", description: "If off, tags stay active even after trial ends (testing only)" },
            ],
        },
        {
            id: "limits",
            icon: Sliders,
            color: "text-blue-400",
            title: "Platform Limits",
            description: "Set per-plan asset and tag limits.",
            controls: [
                { key: "limits.free_max_assets", label: "Max Assets (Free Plan)", type: "number", min: 1, max: 100, description: "Maximum number of assets a FREE user can create" },
                { key: "limits.free_max_tags_per_asset", label: "Max Tags Per Asset (Free)", type: "number", min: 1, max: 10, description: "Maximum tags per asset for FREE users" },
                { key: "limits.premium_max_assets", label: "Max Assets (Premium)", type: "number", min: 1, max: 1000, description: "Maximum assets a PREMIUM user can create" },
            ],
        },
        {
            id: "features",
            icon: Users,
            color: "text-emerald-400",
            title: "Platform Features",
            description: "Toggle individual app features on or off.",
            controls: [
                { key: "feature.family_sharing", label: "Family Sharing", type: "toggle", description: "Allow users to share assets with family members" },
                { key: "feature.chat_threads", label: "Chat Threads", type: "toggle", description: "Enable real-time chat between scanner and owner" },
                { key: "feature.auto_replies", label: "Auto Replies", type: "toggle", description: "Allow owners to configure automatic reply messages" },
                { key: "feature.vehicle_history", label: "Vehicle/Asset History Page", type: "toggle", description: "Show scan history to asset owners" },
                { key: "feature.nfc_programming_guide", label: "NFC Programming Guide", type: "toggle", description: "Show NFC setup instructions in user dashboard" },
            ],
        },
        {
            id: "security",
            icon: Shield,
            color: "text-yellow-400",
            title: "Security & Maintenance",
            description: "Critical platform controls — use with caution.",
            controls: [
                { key: "security.block_new_registrations", label: "Block New Registrations", type: "toggle", description: "Prevent new users from signing up", danger: true },
                { key: "security.maintenance_mode", label: "Maintenance Mode", type: "toggle", description: "Redirect all public pages to a maintenance message", danger: true },
                { key: "security.read_only_mode", label: "Read-Only Mode", type: "toggle", description: "Disable all write operations (scanning still works, messages don't send)", danger: true },
            ],
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
                        <p className="text-slate-500 mt-1">Configure every aspect of ReachMasked behavior</p>
                    </div>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 py-1 px-3">
                    <Settings className="h-3 w-3 mr-1" />
                    Admin Only
                </Badge>
            </div>

            <div className="space-y-6">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Card key={section.id} className="border-white/10 bg-white/5 backdrop-blur-sm">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Icon className={`h-5 w-5 ${section.color}`} />
                                    {section.title}
                                </CardTitle>
                                <CardDescription className="text-slate-500">{section.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-5">
                                <AdminSettingsForm
                                    sectionId={section.id}
                                    controls={section.controls}
                                    settings={settings}
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
