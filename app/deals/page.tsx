"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/deals");
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load deals");
          setDeals([]);
          return;
        }

        // ✅ ensure array
        setDeals(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message || "Client error");
        setDeals([]);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Deals</h1>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && deals.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          No deals yet. Create one in <Link className="underline" href="/new-deal">New Deal</Link>.
        </div>
      )}

      <div className="space-y-3">
        {deals.map((deal) => {
          const purchase = Number(deal.purchasePrice || 0);
          const rehab = Number(deal.rehabCost || 0);
          const investment = purchase + rehab;

          return (
            <Link
              key={deal.dealId}
              href={`/deals/${deal.dealId}`}
              className="block rounded-xl bg-white p-4 shadow hover:bg-gray-50"
            >
              <div className="font-semibold">
                {deal.zip} • {deal.bedrooms}BR
              </div>
              <div className="text-sm text-gray-600">
                Investment: ${investment.toLocaleString()} • Rent: ${Number(deal.hudRent || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {deal.createdAt ? new Date(deal.createdAt).toLocaleString() : ""}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
