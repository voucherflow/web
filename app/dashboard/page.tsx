export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getRecentHudLookups } from "@/lib/hudLookups";

export default async function DashboardPage() {
  const lookups = await getRecentHudLookups(10);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-700">
          Recent activity across VoucherFlow.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent HUD Rent Lookups</h2>
          <span className="text-sm text-gray-600">{lookups.length} shown</span>
        </div>

        {lookups.length === 0 ? (
          <p className="mt-4 text-gray-700">
            No lookups yet. Run a HUD Rent Lookup to see history here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">ZIP</th>
                  <th className="py-2 pr-4">Beds</th>
                  <th className="py-2 pr-4">Rent</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Area</th>
                </tr>
              </thead>
              <tbody>
                {lookups.map((x) => (
                  <tr key={`${x.pk}-${x.sk}`} className="border-b">
                    <td className="py-2 pr-4">
                      {new Date(x.sk).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{x.zip}</td>
                    <td className="py-2 pr-4">{x.bedrooms}</td>
                    <td className="py-2 pr-4 font-semibold">
                      ${Number(x.rent).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{x.source}</td>
                    <td className="py-2 pr-4">{x.areaName || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
