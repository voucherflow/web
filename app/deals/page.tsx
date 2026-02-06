"use client";
import { useEffect, useState } from "react";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/deals")
      .then(r => r.json())
      .then(setDeals);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Deals</h1>

      {deals.map(deal => (
        <a
          key={deal.dealId}
          href={`/deals/${deal.dealId}`}
          className="block rounded-xl bg-white p-4 shadow hover:bg-gray-50"
        >
          <div className="font-semibold">
            {deal.zip} • {deal.bedrooms}BR
          </div>
          <div className="text-sm text-gray-600">
            Investment: ${deal.purchasePrice + deal.rehabCost} • Rent: ${deal.hudRent}
          </div>
        </a>
      ))}
    </div>
  );
}
