"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, Trash2, ShieldCheck, Mail } from "lucide-react";
import { addFamilyMember, removeFamilyMember } from "@/app/actions/family";
import { toast } from "sonner";

interface FamilyMemberItem {
    id: string;
    memberId: string;
    role: string;
    member: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface FamilyOwnership {
    id: string;
    ownerId: string;
    owner: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface FamilyManagerProps {
    members: FamilyMemberItem[];
    ownerships: FamilyOwnership[];
}

export function FamilyManager({ members, ownerships }: FamilyManagerProps) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleAddMember(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        const result = await addFamilyMember(email);
        setIsSubmitting(false);

        if (result.success) {
            toast.success(result.message);
            setEmail("");
        } else {
            toast.error(result.message);
        }
    }

    async function handleRemoveMember(memberId: string) {
        if (!confirm("Are you sure you want to remove this member? They will lose access to shared assets.")) return;

        const result = await removeFamilyMember(memberId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <div className="space-y-8">
            {/* Add Member Section */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Invite Family Member
                    </CardTitle>
                    <CardDescription>
                        Enter the email address of the person you want to share your assets with. They must already have an account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddMember} className="flex gap-4">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="family@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Inviting..." : "Add Member"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Members List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            Your Family Group
                        </CardTitle>
                        <CardDescription>People who can see and manage your assets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4 italic">No family members added yet.</p>
                        ) : (
                            members.map((m) => (
                                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{m.member.name || "User"}</p>
                                        <p className="text-xs text-muted-foreground truncate">{m.member.email}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => handleRemoveMember(m.member.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-blue-500" />
                            Shared With You
                        </CardTitle>
                        <CardDescription>Groups you belong to and assets you can monitor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {ownerships.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4 italic">No shared groups yet.</p>
                        ) : (
                            ownerships.map((o) => (
                                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{o.owner.name || "Owner"}&apos;s Assets</p>
                                        <p className="text-xs text-muted-foreground truncate">{o.owner.email}</p>
                                    </div>
                                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-medium">
                                        Member
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
