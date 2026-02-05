import { Suspense } from "react";
import ZipInsightsClient from "./ZipInsightsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ZipInsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">ZIP Insights</h1>
          <p className="mt-2 text-gray-700">Loading…</p>
        </div>
      }
    >
      <ZipInsightsClient />
    </Suspense>
  );
}
