"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ZipItem = {
  pk: string;
  sk: string;
  zip: string;
  bedrooms: number;
  rent: number;
  source: string;
  areaName?: string | null;
};

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function ZipInsightsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const urlZip = (sp.get("zip") || "").trim();
  const [zip, setZip] = useState(urlZip);
  const [items, setItems] = useState<ZipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isZip = /^\d{5}$/.test(urlZip);

  useEffect(() => {
    setZip(urlZip);
  }, [urlZip]);

  useEffect(() => {
    const run = async () => {
      setError(null);
      setItems([]);

      if (!isZip) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/zip-lookups?zip=${urlZip}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load lookups");

        setItems(json.items || []);
      } catch (e: any) {
        setError(e.message || "Error");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [urlZip, isZip]);

  const stats = useMemo(() => {
    const byBeds = new Map<number, number[]>();
    for (const x of items) {
      const beds = Number(x.bedrooms);
      const rent = Number(x.rent);
      if (!byBeds.has(beds)) byBeds.set(beds, []);
      byBeds.get(beds)!.push(rent);
    }

    return Array.from(byBeds.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([beds, rents]) => ({
        beds,
        latestRent: rents[0] ?? null,
        avgRent: avg(rents),
        samples: rents.length,
      }));
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">ZIP Insights</h1>
        <p className="mt-2 text-gray-700">
          Explore your lookup history for a ZIP code and see quick rent trends.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Enter ZIP (e.g., 39339)"
            className="w-60 rounded-lg border border-gray-300 bg-white p-2 text-gray-900"
          />
          <button
            type="button"
            onClick={() => router.push(`/zip-insights?zip=${encodeURIComponent(zip.trim())}`)}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            View Insights
          </button>
        </div>

        {!urlZip ? (
          <p className="mt-4 text-gray-600">Enter a ZIP to see insights.</p>
        ) : !isZip ? (
          <p className="mt-4 text-red-600">ZIP must be 5 digits.</p>
        ) : loading ? (
          <p className="mt-4 text-gray-600">Loading…</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : (
          <p className="mt-4 text-gray-600">
            Showing latest {items.length} lookups for{" "}
            <span className="font-semibold">{urlZip}</span>.
          </p>
        )}
      </div>

      {isZip && stats.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick Stats</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {stats.map((s) => (
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

          {items.length === 0 && !loading ? (
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
                  {items.map((x) => (
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
