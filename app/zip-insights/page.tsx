export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getZipLookups } from "@/lib/zipInsights";

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default async function ZipInsightsPage({
  searchParams,
}: {
  searchParams: { zip?: string };
}) {
  const zip = (searchParams.zip || "").trim();
  const isZip = /^\d{5}$/.test(zip);

  const lookups = isZip ? await getZipLookups(zip, 20) : [];

  const byBeds = new Map<number, number[]>();
  for (const x of lookups) {
    const beds = Number(x.bedrooms);
    const rent = Number(x.rent);
    if (!byBeds.has(beds)) byBeds.set(beds, []);
    byBeds.get(beds)!.push(rent);
  }

  const bedStats = Array.from(byBeds.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([beds, rents]) => ({
      beds,
      avgRent: avg(rents),
      latestRent: rents[0] ?? null, // because results are newest-first
      samples: rents.length,
    }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">ZIP Insights</h1>
        <p className="mt-2 text-gray-700">
          Explore your lookup history for a ZIP code and see quick rent trends.
        </p>

        <form className="mt-5 flex flex-wrap gap-3" action="/zip-insights" method="get">
          <input
            name="zip"
            defaultValue={zip}
            placeholder="Enter ZIP (e.g., 39339)"
            className="w-60 rounded-lg border border-gray-300 bg-white p-2 text-gray-900"
          />
          <button className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90">
            View Insights
          </button>
        </form>

        {!zip ? (
          <p className="mt-4 text-gray-600">Enter a ZIP to see insights.</p>
        ) : !isZip ? (
          <p className="mt-4 text-red-600">ZIP must be 5 digits.</p>
        ) : (
          <p className="mt-4 text-gray-600">
            Showing latest {lookups.length} lookups for <span className="font-semibold">{zip}</span>.
          </p>
        )}
      </div>

      {isZip && bedStats.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick Stats</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {bedStats.map((s) => (
              <div key={s.beds} className="rounded-xl border border-gray-200 p-4">
                <div className="text-sm text-gray-600">{s.beds} Beds</div>
                <div className="mt-2 text-xl font-bold">
                  ${s.latestRent?.toLocaleString() ?? "-"}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Avg: ${s.avgRent?.toLocaleString() ?? "-"} • Samples: {s.samples}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isZip && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Lookups</h2>

          {lookups.length === 0 ? (
            <p className="mt-4 text-gray-700">
              No lookups logged for this ZIP yet. Run a HUD Rent Lookup first.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Beds</th>
                    <th className="py-2 pr-4">Rent</th>
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Area</th>
                  </tr>
                </thead>
                <tbody>
                  {lookups.map((x) => (
                    <tr key={`${x.pk}-${x.sk}`} className="border-b">
                      <td className="py-2 pr-4">{new Date(x.sk).toLocaleString()}</td>
                      <td className="py-2 pr-4">{x.bedrooms}</td>
                      <td className="py-2 pr-4 font-semibold">${Number(x.rent).toLocaleString()}</td>
                      <td className="py-2 pr-4">{x.source}</td>
                      <td className="py-2 pr-4">{x.areaName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
