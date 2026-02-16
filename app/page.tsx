import { DailyUsage, getNeonUsage } from '@/lib/neon-api';
import { UsageDashboard } from '@/components/usage-dashboard';

export default async function DashboardPage() {
  const orgId = process.env.NEXT_PUBLIC_ORG_ID;

  if (!orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <strong>Configuration Error:</strong> NEXT_PUBLIC_ORG_ID is not defined. Please set your Organization ID in the environment variables.
        </div>
      </div>
    );
  }

  let usageData: DailyUsage[] = [];
  let error = null;

  try {
    usageData = await getNeonUsage(orgId);
  } catch (e: any) {
    console.error("Failed to fetch neon usage:", e);
    error = e.message || "Unknown error occurred";
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Neon Consumption</h1>
            <p className="text-muted-foreground mt-2">
              Usage for Organization <span className="font-mono text-xs bg-gray-200 px-1 py-0.5 rounded">{orgId}</span>
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Granularity: <strong>Daily</strong>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-white p-6 text-center text-red-600 shadow-sm">
            <p>Failed to load consumption data.</p>
            <p className="text-sm mt-2 opacity-80">{error}</p>
          </div>
        ) : (
          <>
            {usageData.length > 0 ? (
              <UsageDashboard data={usageData} />
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                No consumption data found for the last 30 days.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}