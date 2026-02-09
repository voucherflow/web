"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { underwrite } from "@/lib/underwrite";

export default function ComparePage() {
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareDeals, setCompareDeals] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => setAllDeals(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || "Failed to load deals"));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev; // cap at 4
      return [...prev, id];
    });
  };

  const runCompare = async () => {
    setError("");
    if (selected.length < 2) {
      setCompareDeals([]);
      setError("Select at least 2 deals to compare.");
      return;
    }

    const res = await fetch("/api/deals/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });

    const data = await res.json();
    if (!res.ok) {
      setCompareDeals([]);
      setError(data?.error || "Compare failed");
      return;
    }

    setCompareDeals(Array.isArray(data) ? data : []);
  };

  const rows = useMemo(() => {
    const computed = compareDeals.map((d) => ({
      deal: d,
      u: underwrite(d),
    }));

    return computed;
  }, [compareDeals]);

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Compare Deals</h1>
            <p className="mt-2 text-gray-700">
              Select 2–4 deals and compare underwriting using assumptions + financing.
            </p>
          </div>
          <Link href="/deals" className="text-sm underline">
            View Deals
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div className="text-sm text-gray-700">
          Pick up to 4 deals:
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {allDeals.map((d) => (
            <button
              key={d.dealId}
              onClick={() => toggle(d.dealId)}
              className={`rounded-xl border p-4 text-left hover:bg-gray-50 ${
                selected.includes(d.dealId)
                  ? "border-black bg-gray-50"
                  : "border-gray-200"
              }`}
            >
              <div className="font-semibold">
                {d.zip} • {d.bedrooms}BR
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Rent: {fmtMoney(Number(d.hudRent || 0))} • Purchase:{" "}
                {fmtMoney(Number(d.purchasePrice || 0))}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {selected.includes(d.dealId) ? "Selected" : "Click to select"}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={runCompare}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Compare
          </button>
          <button
            onClick={() => {
              setSelected([]);
              setCompareDeals([]);
              setError("");
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm overflow-x-auto">
          <table className="min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="py-2 pr-4">Metric</th>
                {rows.map(({ deal }) => (
                  <th key={deal.dealId} className="py-2 pr-4">
                    {deal.zip} • {deal.bedrooms}BR
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {[
                ["Purchase", (u: any) => fmtMoney(u.purchase)],
                ["Rehab", (u: any) => fmtMoney(u.rehab)],
                ["Total Cost", (u: any) => fmtMoney(u.totalCost)],
                ["HUD Rent (mo)", (u: any) => fmtMoney(u.rent)],
                ["NOI (annual)", (u: any) => fmtMoney(u.noi)],
                ["Cap Rate", (u: any) => fmtPct(u.capRate)],
                ["Debt Service (mo)", (u: any) => fmtMoney(u.debtServiceMonthly)],
                ["Cashflow (mo)", (u: any) => fmtMoney(u.cashflowMonthly)],
                ["ARV", (u: any) => fmtMoney(u.arv)],
                ["Equity", (u: any) => fmtMoney(u.equity)],
                ["ROI", (u: any) => fmtPct(u.roi)],
              ].map(([label, fn]) => (
                <tr key={label as string} className="border-b">
                  <td className="py-2 pr-4 font-medium">{label as string}</td>
                  {rows.map(({ deal, u }) => (
                    <td key={deal.dealId} className="py-2 pr-4">
                      {(fn as any)(u)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 text-xs text-gray-500">
            Notes: Cap Rate / Cashflow depend on saved assumptions + debt service.
          </div>
        </div>
      )}
    </div>
  );
}
