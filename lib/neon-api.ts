import { addDays, subDays } from 'date-fns';

// 1. Define types matching the V2 API
type MetricName =
    | 'compute_unit_seconds'
    | 'root_branch_bytes_month'
    | 'child_branch_bytes_month'
    | 'instant_restore_bytes_month'
    | 'public_network_transfer_bytes'
    | 'private_network_transfer_bytes'
    | 'extra_branches_month';

type MetricValue = {
    metric_name: MetricName;
    value: number;
};

export type DailyUsage = {
    date: string;
    compute: number;         // Seconds
    storageRoot: number;     // GiB
    storageChild: number;    // GiB
    storageHistory: number;  // GiB
    dataTransfer: number;    // GiB
    extraBranches: number;   // Count
};

export type Project = {
    id: string;
    name: string;
};

const apiKey = process.env.NEON_API_KEY;
if (!apiKey) throw new Error('NEON_API_KEY is not defined');

export async function getProjects(orgId: string): Promise<Project[]> {
    const params = new URLSearchParams({ org_id: orgId, limit: '400' });
    const response = await fetch(
        `https://console.neon.tech/api/v2/projects?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json',
            },
            next: { revalidate: 900 },
        }
    );

    if (!response.ok) {
        throw new Error(`Neon API Error: ${response.statusText}`);
    }

    const json = await response.json();
    return (json.projects ?? []).map((p: any) => ({ id: p.id, name: p.name }));
}

export async function getNeonUsage(orgId: string, projectIds?: string[]): Promise<DailyUsage[]> {
    // Calculate Dates: Last 30 days, rounded to midnight UTC
    const today = new Date();

    // To include today in the range
    const tomorrow = addDays(today, 1);
    const thirtyDaysAgo = subDays(today, 30);

    const from = new Date(thirtyDaysAgo.setUTCHours(0, 0, 0, 0)).toISOString();
    const to = new Date(tomorrow.setUTCHours(0, 0, 0, 0)).toISOString();

    // Construct URL with all metrics
    const params = new URLSearchParams({
        from,
        to,
        granularity: 'daily',
        org_id: orgId,
        metrics: [
            'compute_unit_seconds',
            'root_branch_bytes_month',
            'child_branch_bytes_month',
            'instant_restore_bytes_month',
            'public_network_transfer_bytes',
            'extra_branches_month'
        ].join(','),
    });

    if (projectIds && projectIds.length > 0) {
        params.set('project_ids', projectIds.join(','));
    }

    const response = await fetch(
        `https://console.neon.tech/api/v2/consumption_history/v2/projects?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json',
            },
            next: { revalidate: 900 }, // Cache for 15 minutes
        }
    );

    if (!response.ok) {
        throw new Error(`Neon API Error: ${response.statusText}`);
    }

    const json = await response.json();
    const aggregatedData: Record<string, DailyUsage> = {};

    const BYTES_TO_GIB = 1024 * 1024 * 1024;

    // Flatten and Aggregate Data
    json.projects.forEach((project: any) => {
        project.periods.forEach((period: any) => {
            period.consumption.forEach((day: any) => {
                const dateKey = day.timeframe_start;

                // Initialize object if new date
                if (!aggregatedData[dateKey]) {
                    aggregatedData[dateKey] = {
                        date: dateKey,
                        compute: 0,
                        storageRoot: 0,
                        storageChild: 0,
                        storageHistory: 0,
                        dataTransfer: 0,
                        extraBranches: 0
                    };
                }

                // Map and Sum Metrics
                day.metrics.forEach((m: MetricValue) => {
                    switch (m.metric_name) {
                        case 'compute_unit_seconds':
                            aggregatedData[dateKey].compute += m.value;
                            break;
                        case 'root_branch_bytes_month':
                            aggregatedData[dateKey].storageRoot += m.value / BYTES_TO_GIB;
                            break;
                        case 'child_branch_bytes_month':
                            aggregatedData[dateKey].storageChild += m.value / BYTES_TO_GIB;
                            break;
                        case 'instant_restore_bytes_month':
                            aggregatedData[dateKey].storageHistory += m.value / BYTES_TO_GIB;
                            break;
                        case 'public_network_transfer_bytes':
                        case 'private_network_transfer_bytes':
                            aggregatedData[dateKey].dataTransfer += m.value / BYTES_TO_GIB;
                            break;
                        case 'extra_branches_month':
                            aggregatedData[dateKey].extraBranches += m.value;
                            break;
                    }
                });
            });
        });
    });

    return Object.values(aggregatedData).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}