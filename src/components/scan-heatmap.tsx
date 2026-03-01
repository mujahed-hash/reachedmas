"use client";

import { useMemo } from "react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScanHeatmapProps {
    interactions: { timestamp: Date; actionType: string }[];
}

export function ScanHeatmap({ interactions }: ScanHeatmapProps) {
    const data = useMemo(() => {
        const days: { date: Date; displayDate: string; scans: number; contacts: number }[] = [];
        const today = startOfDay(new Date());

        // Generate last 14 days
        for (let i = 13; i >= 0; i--) {
            const date = subDays(today, i);
            days.push({
                date,
                displayDate: format(date, "MMM d"),
                scans: 0,
                contacts: 0,
            });
        }

        // Aggregate data
        interactions.forEach((interaction) => {
            const intDate = startOfDay(new Date(interaction.timestamp));
            const day = days.find((d) => isSameDay(d.date, intDate));
            if (day) {
                if (interaction.actionType === "SCAN_VIEW") {
                    day.scans += 1;
                } else {
                    day.contacts += 1;
                }
            }
        });

        return days;
    }, [interactions]);

    return (
        <Card className="border-border bg-card w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Scan Activity (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="displayDate"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                stroke="#888888"
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                stroke="#888888"
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                            />
                            <Bar dataKey="scans" name="Scans" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} stackId="a" />
                            <Bar dataKey="contacts" name="Contacts (SMS/Call)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
