<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://neon.com/brand/neon-logo-dark-color.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://neon.com/brand/neon-logo-light-color.svg">
  <img width="250px" alt="Neon Logo fallback" src="https://neon.com/brand/neon-logo-dark-color.svg">
</picture>

### Usage Dashboard with Neon Consumption API

A Next.js-based internal tool to track and visualize your Neon usage programmatically using the [Project Consumption metrics API](https://api-docs.neon.tech/reference/getconsumptionhistoryperprojectv2).

---

Neon's usage-based pricing ensures you only pay for resources you consume. To help monitor these costs, the Neon Consumption API provides detailed usage data including compute time, storage, and data transfer.

This repository demonstrates how to build a usage dashboard using Next.js and the Neon Consumption API. It covers fetching, aggregating, and visualizing usage metrics for your organization.

Follow the full guide on [Neon: Building a Usage Dashboard with Neon's Consumption API](https://neon.com/guides/usage-dashboard-consumption-api) for step-by-step instructions.

## ✨ Key features

-   **Usage Monitoring**: Visualize daily compute, storage, and data transfer trends.
-   **Project Filtering**: Filter usage data by specific projects to isolate costs.
-   **Summary Metrics**: View total compute time, average storage, and peak extra branches at a glance.
-   **Granular Insights**: Track usage data daily over the last 30 days.
-   **Server-Side Data Fetching**: Securely fetch data using Next.js Server Actions.

## 🚀 Get started

### Prerequisites

Before you start, you'll need:

1.  A **[Neon account](https://console.neon.tech)** and a project on a usage-based plan.
2.  **[Node.js](https://nodejs.org/)** (v20+) installed locally.
3.  A valid **Neon API Key** (create one in [Settings > API Keys](https://console.neon.tech/app/settings/api-keys)).
4.  Your **Organization ID** (found in Organization settings).

### Initial setup

Clone this repository and install the dependencies.

```bash
# Clone the repository
git clone https://github.com/dhanushreddy291/neon-usage-dashboard.git
cd neon-usage-dashboard

# Install dependencies
npm install
```

### Environment variables

Create a `.env.local` file in the root directory.

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your Neon API Key and Organization ID.

```env
NEON_API_KEY="your_api_key_here"
NEXT_PUBLIC_ORG_ID="your_org_id_here"
```

### Run the app

Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000` to see your Neon usage dashboard in action.

## Demo

### Consumption Dashboard
A centralized view to monitor your organization's resource consumption, including compute, storage, and data transfer.

<p align="left">
    <img src="./images/neon-usage-dashboard-consumption-api.png" alt="Neon Usage Dashboard" width="700"/>
</p>

### Project Filtering
Scope the dashboard to specific projects using the multi-select dropdown, powered by Next.js Server Actions.

## ⚙️ How it works

This application uses the V2 Consumption API exposed by Neon.

1.  **Fetching Usage Data**:
    The dashboard fetches daily aggregated usage metrics for the last 30 days.

    ```typescript
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
    ```

2.  **Listing Projects**:
    Retrieves a list of all projects in the organization to populate the filter dropdown.

    ```typescript
    export async function getProjects(orgId: string): Promise<Project[]> {
        const params = new URLSearchParams({ org_id: orgId, limit: '400' });
        // ... fetch from /api/v2/projects
    }
    ```

3.  **Filtering by Project**:
    A Server Action re-fetches usage data when specific projects are selected.

    ```typescript
    // app/actions.ts
    export async function fetchUsageByProjects(projectIds: string[]): Promise<DailyUsage[]> {
        return getNeonUsage(orgId, projectIds.length > 0 ? projectIds : undefined);
    }
    ```

## 📚 Learn more

-   [Neon Guide: Building a Usage Dashboard with Neon's Consumption API](https://neon.com/guides/usage-dashboard-consumption-api)
-   [Neon Consumption API Reference](https://api-docs.neon.tech/reference/getconsumptionhistoryperprojectv2)
-   [Neon API Keys](https://console.neon.tech/app/settings/api-keys)
-   [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
