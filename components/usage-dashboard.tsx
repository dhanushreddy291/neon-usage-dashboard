'use client';

import { useState, useTransition } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Database, HardDrive, Activity, Network, Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyUsage, Project } from '@/lib/neon-api';
import { fetchUsageByProjects } from '@/app/actions';

interface UsageDashboardProps {
    data: DailyUsage[];
    projects: Project[];
}

export function UsageDashboard({ data: initialData, projects }: UsageDashboardProps) {
    const [data, setData] = useState(initialData);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function toggleProject(projectId: string) {
        const next = selectedProjects.includes(projectId)
            ? selectedProjects.filter((id) => id !== projectId)
            : [...selectedProjects, projectId];
        setSelectedProjects(next);

        startTransition(async () => {
            try {
                const result = await fetchUsageByProjects(next);
                setData(result);
            } catch (e) {
                console.error('Failed to fetch filtered usage:', e);
            }
        });
    }

    function clearFilter() {
        setSelectedProjects([]);
        startTransition(async () => {
            try {
                const result = await fetchUsageByProjects([]);
                setData(result);
            } catch (e) {
                console.error('Failed to fetch usage:', e);
            }
        });
    }

    const totals = data.reduce((acc, curr) => ({
        compute: acc.compute + curr.compute,
        storage: acc.storage + (curr.storageRoot + curr.storageChild + curr.storageHistory),
        transfer: acc.transfer + curr.dataTransfer,
        branches: Math.max(acc.branches, curr.extraBranches)
    }), { compute: 0, storage: 0, transfer: 0, branches: 0 });

    const computeHours = (totals.compute / 3600).toFixed(1);

    return (
        <div className="space-y-6">

            {/* 0. Project Filter */}
            <div className="relative inline-block">
                <button
                    onClick={() => setOpen(!open)}
                    className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {selectedProjects.length === 0
                        ? 'All Projects'
                        : `${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''} selected`}
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {open && (
                    <div className="absolute left-0 z-50 mt-1 w-72 rounded-md border bg-white shadow-lg">
                        <div className="max-h-60 overflow-y-auto p-1">
                            {projects.map((project) => {
                                const isSelected = selectedProjects.includes(project.id);
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => toggleProject(project.id)}
                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                                    >
                                        <span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary border-primary text-white' : ''}`}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </span>
                                        <span className="truncate">{project.name}</span>
                                        <span className="ml-auto font-mono text-xs text-muted-foreground">{project.id.slice(0, 12)}</span>
                                    </button>
                                );
                            })}
                            {projects.length === 0 && (
                                <div className="px-2 py-4 text-center text-sm text-muted-foreground">No projects found</div>
                            )}
                        </div>
                        {selectedProjects.length > 0 && (
                            <div className="border-t p-1">
                                <button
                                    onClick={clearFilter}
                                    className="w-full rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-gray-100"
                                >
                                    Clear filter
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 1. Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Compute"
                    value={`${computeHours} hrs`}
                    description="Active compute time"
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                />
                <SummaryCard
                    title="Avg Storage"
                    value={`${(totals.storage / (data.length || 1)).toFixed(2)} GiB`}
                    description="Root + Child + History"
                    icon={<Database className="h-4 w-4 text-muted-foreground" />}
                />
                <SummaryCard
                    title="Data Transfer"
                    value={`${totals.transfer.toFixed(2)} GiB`}
                    description="Public + Private Egress"
                    icon={<Network className="h-4 w-4 text-muted-foreground" />}
                />
                <SummaryCard
                    title="Peak Extra Branches"
                    value={totals.branches.toString()}
                    description="Max concurrent extra branches"
                    icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            {/* 2. Main Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Compute Usage</CardTitle>
                    <CardDescription>
                        Compute unit seconds over the last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                                    minTickGap={30}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-white p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Date
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {format(new Date(label), 'MMM dd')}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Compute
                                                            </span>
                                                            <span className="font-bold text-[#00e599]">
                                                                {Number(payload[0].value).toLocaleString()} sec
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="compute"
                                    fill="#43a2fb"
                                    radius={[4, 4, 0, 0]}
                                    name="Compute Seconds"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard({ title, value, description, icon }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}