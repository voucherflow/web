"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DealDetail() {
  const params = useParams();          // correct way
  const id = params?.id as string;     // extract dealId safely

  const [deal, setDeal] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch("/api/deals")
      .then((r) => r.json())
      .then((items) => setDeal(items.find((d: any) => d.dealId === id)));
  }, [id]);

  if (!deal) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Deal — {deal.zip} • {deal.bedrooms}BR
      </h1>

      <div className="rounded-xl bg-white p-6 shadow whitespace-pre-wrap">
        <h2 className="text-lg font-semibold mb-3">AI Investment Memo</h2>
        {deal.memo}
      </div>
    </div>
  );
}
