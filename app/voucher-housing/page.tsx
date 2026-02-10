"use client";

import { useState } from "react";

export default function VoucherHousingPage() {
  const [zip, setZip] = useState("");
  const [beds, setBeds] = useState(0);
  const [maxRent, setMaxRent] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const search = async () => {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const qs = new URLSearchParams();
      qs.set("zip", zip.trim());
      if (beds > 0) qs.set("beds", String(beds));
      if (maxRent > 0) qs.set("maxRent", String(maxRent));

      const res = await fetch(`/api/public/listings?${qs.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Search failed");
      setResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Voucher-Friendly Housing</h1>
        <p className="mt-2 text-gray-700">
          Search listings that accept Housing Choice Vouchers. Enter a ZIP to find available homes.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4 text-sm">
          <input
            className="input"
            placeholder="ZIP (required)"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="Min beds (optional)"
            value={beds || ""}
            onChange={(e) => setBeds(Number(e.target.value))}
          />
          <input
            className="input"
            type="number"
            placeholder="Max rent (optional)"
            value={maxRent || ""}
            onChange={(e) => setMaxRent(Number(e.target.value))}
          />
          <button
            onClick={search}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            {results.map((x) => (
              <div key={x.sk} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold">
                    {x.zip} • {x.beds}BR / {x.baths}BA • {fmtMoney(Number(x.rent || 0))}
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                    Voucher Accepted ✅
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {x.city ? `${x.city}, ${x.state}` : ""}
                  {x.title ? ` • ${x.title}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !error && !loading && (
          <p className="mt-4 text-sm text-gray-700">
            Enter a ZIP and search to see available listings.
          </p>
        )}
      </div>
    </div>
  );
}
