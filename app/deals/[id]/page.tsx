"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";

export default function DealDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [deal, setDeal] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/deals/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load deal");
          setDeal(null);
          return;
        }

        setDeal(data);
      } catch (e: any) {
        setError(e?.message || "Client error");
        setDeal(null);
      }
    };

    load();
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

    // Multi-page support
    for (let i = 0; i < lines.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(lines[i], 14, y);
      y += 5;
    }

    doc.save(`VoucherFlow_Deal_${deal.zip}_${deal.dealId}.pdf`);
  };

  const deleteDeal = async () => {
    if (!id) return;

    const ok = window.confirm("Delete this deal? This cannot be undone.");
    if (!ok) return;

    const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data?.error || "Failed to delete deal");
      return;
    }

    router.push("/deals");
  };

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!deal) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            Deal — {deal.zip} • {deal.bedrooms}BR
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPdf}
              className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
            >
              Export PDF
            </button>

            <button
              onClick={deleteDeal}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
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
