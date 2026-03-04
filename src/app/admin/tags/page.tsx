import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, QrCode, ExternalLink, Eye, Mail } from "lucide-react";
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
    const tags = await getTags();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Tag Management</h1>
                        <p className="text-slate-500">
                            {tags.length} security tags active in database
                        </p>
                    </div>
                </div>
            </div>

            {/* Tags Grid (Refined for Command Center) */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Digital ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Linked Vehicle
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Owner Ident
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Security Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                                    Total Scans
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Last Activity
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tags.map((tag) => (
                                <tr key={tag.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-sm font-mono border border-indigo-500/20">
                                            {tag.shortCode}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="text-sm font-medium text-white">
                                                {tag.vehicle.color} {tag.vehicle.model}
                                            </span>
                                            {tag.vehicle.licensePlateHash && (
                                                <span className="text-xs text-slate-500 block font-mono uppercase">
                                                    #{tag.vehicle.licensePlateHash}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 opacity-50" />
                                            {tag.vehicle.owner.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <TagStatusBadge status={tag.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center">
                                        <span className="inline-flex items-center gap-1 text-slate-300 bg-white/5 px-2 py-1 rounded-md">
                                            <Eye className="h-3 w-3 opacity-50" />
                                            {tag._count.interactions}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tag.interactions[0] ? (
                                            <div className="text-xs">
                                                <span className="text-slate-300 font-medium">
                                                    {new Date(tag.interactions[0].timestamp).toLocaleDateString()}
                                                </span>
                                                <span className="block text-slate-500 text-[10px] uppercase tracking-tighter mt-0.5">
                                                    {tag.interactions[0].actionType.replace("_", " ")}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">No logs</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/t/${tag.shortCode}`} target="_blank">
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5">
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
                        <div className="p-16 text-center">
                            <QrCode className="h-16 w-16 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 font-medium">No tracking tags initialized</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
