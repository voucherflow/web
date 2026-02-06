"use client";
import { useEffect, useState } from "react";

export default function DealDetail({ params }: { params: { id: string } }) {
  const [deal, setDeal] = useState<any>(null);

  useEffect(() => {
    fetch("/api/deals")
      .then(r => r.json())
      .then(items => setDeal(items.find((d: any) => d.dealId === params.id)));
  }, [params.id]);

  if (!deal) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deal {deal.zip}</h1>
      <div className="rounded-xl bg-white p-6 shadow whitespace-pre-wrap">
        {deal.memo}
      </div>
    </div>
  );
}
