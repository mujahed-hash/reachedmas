import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SettingsFormSection, NotifToggle } from "@/components/settings-form-section";
import {
    updateProfile,
    updatePhone,
    updateNotificationPrefs,
    changePassword,
    getSettingsData,
} from "@/app/actions/settings";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const data = await getSettingsData();
    if (!data) redirect("/login");

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                    <Link href="/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Separator orientation="vertical" className="h-5" />
                    <Link href="/" className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">ReachMasked</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your profile, security, and notification preferences.</p>
                </div>

                <div className="space-y-6">
                    {/* ── Profile Section ── */}
                    <SettingsFormSection
                        title="Profile"
                        description="Update your display name and email address."
                        action={updateProfile}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                defaultValue={data.name ?? ""}
                                placeholder="John Smith"
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={data.email}
                                required
                                className="bg-muted/50 border-border"
                            />
                        </div>
                    </SettingsFormSection>

                    {/* ── Phone Section ── */}
                    <SettingsFormSection
                        title="Phone Number"
                        description="Used to receive SMS alerts when someone contacts you. Stored encrypted with AES-256."
                        action={updatePhone}
                        submitLabel="Update Phone"
                    >
                        {data.hasPhone && (
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                                <span>Current: {data.phoneMasked}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="phone">New Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                className="bg-muted/50 border-border"
                            />
                        </div>
                    </SettingsFormSection>

                    {/* ── Notification Preferences ── */}
                    <SettingsFormSection
                        title="Notifications"
                        description="Choose how you want to be alerted when your vehicle is contacted."
                        action={updateNotificationPrefs}
                        submitLabel="Save Preferences"
                    >
                        <NotifToggle
                            name="emailNotif"
                            label="Email Notifications"
                            description="Receive email alerts for all contact events."
                            defaultChecked={data.emailNotif}
                        />
                        <NotifToggle
                            name="smsNotif"
                            label="SMS Notifications"
                            description="Receive text messages for contact events. Requires a verified phone number and Twilio."
                            defaultChecked={data.smsNotif}
                        />
                    </SettingsFormSection>

                    {/* ── Change Password ── */}
                    <SettingsFormSection
                        title="Change Password"
                        description="Update your account password. Choose something strong and unique."
                        action={changePassword}
                        submitLabel="Change Password"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                required
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                minLength={8}
                                required
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                minLength={8}
                                required
                                className="bg-muted/50 border-border"
                            />
                        </div>
                    </SettingsFormSection>
                </div>
            </main>
        </div>
    );
}
