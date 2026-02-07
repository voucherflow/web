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
  const [assumptions, setAssumptions] = useState({
    vacancyPct: 8,
    repairsPct: 8,
    managementPct: 10,
    capexPct: 5,
    taxesMonthly: 0,
    insuranceMonthly: 0,
    hoaMonthly: 0,
    debtServiceMonthly: 0, // optional: mortgage payment
  });


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

  const purchase = Number(deal.purchasePrice || 0);
  const rehab = Number(deal.rehabCost || 0);
  const arv = Number(deal.arv || 0);
  const rent = Number(deal.hudRent || 0);

  const totalInvestment = purchase + rehab;
  const annualRent = rent * 12;

  const vacancyLoss = annualRent * (assumptions.vacancyPct / 100);
  const repairs = annualRent * (assumptions.repairsPct / 100);
  const management = annualRent * (assumptions.managementPct / 100);
  const capex = annualRent * (assumptions.capexPct / 100);

  const fixedExpensesAnnual =
    (Number(assumptions.taxesMonthly || 0) +
      Number(assumptions.insuranceMonthly || 0) +
      Number(assumptions.hoaMonthly || 0)) *
    12;

  const operatingExpensesAnnual = vacancyLoss + repairs + management + capex + fixedExpensesAnnual;

  const noiAnnual = annualRent - operatingExpensesAnnual;
  const noiMonthly = noiAnnual / 12;

  const capRate = totalInvestment > 0 ? (noiAnnual / totalInvestment) * 100 : 0;

  const debtServiceAnnual = Number(assumptions.debtServiceMonthly || 0) * 12;
  const cashflowAnnual = noiAnnual - debtServiceAnnual;
  const cashflowMonthly = cashflowAnnual / 12;

  const dscr = debtServiceAnnual > 0 ? noiAnnual / debtServiceAnnual : null;


  const onePercentRule = totalInvestment > 0 ? rent / totalInvestment >= 0.01 : false;
  const rehabPct = purchase > 0 ? (rehab / purchase) * 100 : 0;
  const rentToPricePct = purchase > 0 ? (rent / purchase) * 100 : 0;
  const simpleRoiPct = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

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

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Deal Summary</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Total Investment</div>
            <div className="font-semibold">{fmtMoney(totalInvestment)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Gross Rent (Annual)</div>
            <div className="font-semibold">{fmtMoney(annualRent)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Simple ROI (Gross)</div>
            <div className="font-semibold">{fmtPct(simpleRoiPct)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">1% Rule</div>
            <div className={`font-semibold ${onePercentRule ? "text-green-700" : "text-red-700"}`}>
              {onePercentRule ? "Pass" : "Fail"}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Rent ÷ Total Investment ≥ 1%
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Rehab % of Purchase</div>
            <div className="font-semibold">{fmtPct(rehabPct)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Rent-to-Price (Monthly)</div>
            <div className="font-semibold">{fmtPct(rentToPricePct)}</div>
          </div>
        </div>

        {arv > 0 && totalInvestment > 0 && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold mb-1">Equity Snapshot (simple)</div>
            <div>
              ARV: <span className="font-semibold">{fmtMoney(arv)}</span> • Investment:{" "}
              <span className="font-semibold">{fmtMoney(totalInvestment)}</span> • Spread:{" "}
              <span className="font-semibold">{fmtMoney(arv - totalInvestment)}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              This is a simplified spread (does not include holding, financing, closing costs, etc.).
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Underwriting Assumptions</h2>
        <p className="mt-1 text-sm text-gray-600">
          Adjust assumptions to estimate NOI, cap rate, and cashflow.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-4 text-sm">
          <label className="space-y-1">
            <div className="text-gray-600">Vacancy %</div>
            <input
              type="number"
              className="input"
              value={assumptions.vacancyPct}
              onChange={(e) => setAssumptions({ ...assumptions, vacancyPct: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">Repairs %</div>
            <input
              type="number"
              className="input"
              value={assumptions.repairsPct}
              onChange={(e) => setAssumptions({ ...assumptions, repairsPct: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">Mgmt %</div>
            <input
              type="number"
              className="input"
              value={assumptions.managementPct}
              onChange={(e) => setAssumptions({ ...assumptions, managementPct: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">CapEx %</div>
            <input
              type="number"
              className="input"
              value={assumptions.capexPct}
              onChange={(e) => setAssumptions({ ...assumptions, capexPct: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">Taxes (mo)</div>
            <input
              type="number"
              className="input"
              value={assumptions.taxesMonthly}
              onChange={(e) => setAssumptions({ ...assumptions, taxesMonthly: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">Insurance (mo)</div>
            <input
              type="number"
              className="input"
              value={assumptions.insuranceMonthly}
              onChange={(e) => setAssumptions({ ...assumptions, insuranceMonthly: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">HOA (mo)</div>
            <input
              type="number"
              className="input"
              value={assumptions.hoaMonthly}
              onChange={(e) => setAssumptions({ ...assumptions, hoaMonthly: Number(e.target.value) })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-gray-600">Debt Service (mo)</div>
            <input
              type="number"
              className="input"
              value={assumptions.debtServiceMonthly}
              onChange={(e) => setAssumptions({ ...assumptions, debtServiceMonthly: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4 text-sm">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">NOI (mo)</div>
            <div className="font-semibold">{fmtMoney(noiMonthly)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Cap Rate</div>
            <div className="font-semibold">{fmtPct(capRate)}</div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Cashflow (mo)</div>
            <div className={`font-semibold ${cashflowMonthly >= 0 ? "text-green-700" : "text-red-700"}`}>
              {fmtMoney(cashflowMonthly)}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">DSCR</div>
            <div className="font-semibold">{dscr === null ? "—" : dscr.toFixed(2)}</div>
            <div className="mt-1 text-xs text-gray-500">NOI ÷ Debt Service</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="font-semibold mb-1">Expense Breakdown (annual)</div>
          <div>Vacancy: {fmtMoney(vacancyLoss)}</div>
          <div>Repairs: {fmtMoney(repairs)}</div>
          <div>Management: {fmtMoney(management)}</div>
          <div>CapEx: {fmtMoney(capex)}</div>
          <div>Fixed (Taxes/Ins/HOA): {fmtMoney(fixedExpensesAnnual)}</div>
          <div className="mt-2 font-semibold">Total OpEx: {fmtMoney(operatingExpensesAnnual)}</div>
        </div>
      </div>
      
      <div className="rounded-xl bg-white p-6 shadow whitespace-pre-wrap">
        <h2 className="text-lg font-semibold mb-3">AI Investment Memo</h2>
        {deal.memo}
      </div>
    </div>
  );
}
