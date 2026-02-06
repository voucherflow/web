"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";

export default function DealDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [deal, setDeal] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch("/api/deals")
      .then((r) => r.json())
      .then((items) => setDeal(items.find((d: any) => d.dealId === id)));
  }, [id]);

  const exportPdf = () => {
    if (!deal) return;

    const doc = new jsPDF();
    const lineHeight = 7;
    let y = 15;

    doc.setFontSize(16);
    doc.text("VoucherFlow Deal Memo", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`ZIP: ${deal.zip}   Bedrooms: ${deal.bedrooms}`, 14, y); y += lineHeight;
    doc.text(`Purchase: $${Number(deal.purchasePrice).toLocaleString()}`, 14, y); y += lineHeight;
    doc.text(`Rehab: $${Number(deal.rehabCost).toLocaleString()}`, 14, y); y += lineHeight;
    doc.text(`ARV: $${Number(deal.arv).toLocaleString()}`, 14, y); y += lineHeight;
    doc.text(`HUD Rent: $${Number(deal.hudRent).toLocaleString()}/mo`, 14, y); y += 10;

    doc.setFontSize(12);
    doc.text("AI Memo:", 14, y);
    y += 8;

    doc.setFontSize(10);
    const memoText = String(deal.memo || "");
    const lines = doc.splitTextToSize(memoText, 180);
    doc.text(lines, 14, y);

    doc.save(`VoucherFlow_Deal_${deal.zip}_${deal.dealId}.pdf`);
  };

  if (!deal) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            Deal — {deal.zip} • {deal.bedrooms}BR
          </h1>

          <button
            onClick={exportPdf}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Export PDF
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Purchase</div>
            <div className="font-semibold">${Number(deal.purchasePrice).toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Rehab</div>
            <div className="font-semibold">${Number(deal.rehabCost).toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">ARV</div>
            <div className="font-semibold">${Number(deal.arv).toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">HUD Rent</div>
            <div className="font-semibold">${Number(deal.hudRent).toLocaleString()}/mo</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow whitespace-pre-wrap">
        <h2 className="text-lg font-semibold mb-3">AI Investment Memo</h2>
        {deal.memo}
      </div>
    </div>
  );
}
