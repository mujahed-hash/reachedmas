import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, QrCode, ExternalLink, Eye } from "lucide-react";
import { TagActions, TagStatusBadge } from "@/components/admin/tag-actions";

async function getTags() {
    return prisma.tag.findMany({
        include: {
            vehicle: {
                include: {
                    owner: {
                        select: { email: true, id: true },
                    },
                },
            },
            _count: {
                select: { interactions: true },
            },
            interactions: {
                orderBy: { timestamp: "desc" },
                take: 1,
                select: { timestamp: true, actionType: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export default async function AdminTagsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (currentUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const tags = await getTags();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/admin" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <Shield className="h-6 w-6 text-red-500" />
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            ReachMasked Admin
                        </span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Tag Management</h1>
                        <p className="text-muted-foreground">
                            {tags.length} tags • Real-time data from database
                        </p>
                    </div>
                </div>

                {/* Tags Table */}
                <div className="rounded-lg border border-border overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Tag Code
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Vehicle
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Owner
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Scans
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Last Activity
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Created
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tags.map((tag) => (
                                <tr key={tag.id} className="bg-card hover:bg-accent/30 transition">
                                    <td className="px-4 py-3">
                                        <code className="px-2 py-1 rounded bg-muted text-sm font-mono">
                                            {tag.shortCode}
                                        </code>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <span className="text-sm font-medium">
                                                {tag.vehicle.color} {tag.vehicle.model}
                                            </span>
                                            {tag.vehicle.licensePlateHash && (
                                                <span className="text-xs text-muted-foreground block">
                                                    {tag.vehicle.licensePlateHash}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {tag.vehicle.owner.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TagStatusBadge status={tag.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                            {tag._count.interactions}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {tag.interactions[0] ? (
                                            <div className="text-xs">
                                                <span className="text-muted-foreground">
                                                    {new Date(tag.interactions[0].timestamp).toLocaleDateString()}
                                                </span>
                                                <span className="block text-muted-foreground/70">
                                                    {tag.interactions[0].actionType.replace("_", " ")}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Never</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {new Date(tag.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/t/${tag.shortCode}`} target="_blank">
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <TagActions
                                                tagId={tag.id}
                                                shortCode={tag.shortCode}
                                                currentStatus={tag.status}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {tags.length === 0 && (
                        <div className="p-8 text-center bg-card">
                            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No tags generated yet</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
