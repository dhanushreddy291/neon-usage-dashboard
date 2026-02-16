'use server';

import { getNeonUsage, type DailyUsage } from '@/lib/neon-api';

export async function fetchUsageByProjects(projectIds: string[]): Promise<DailyUsage[]> {
    const orgId = process.env.NEXT_PUBLIC_ORG_ID;
    if (!orgId) throw new Error('NEXT_PUBLIC_ORG_ID is not defined');
    return getNeonUsage(orgId, projectIds.length > 0 ? projectIds : undefined);
}
