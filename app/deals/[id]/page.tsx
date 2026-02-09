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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    zip: "",
    bedrooms: 3,
    purchasePrice: 0,
    rehabCost: 0,
    arv: 0,
  });
  const [editLoading, setEditLoading] = useState(false);
  const updateEdit = (k: string, v: any) => setEditForm({ ...editForm, [k]: v });
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
  const [loan, setLoan] = useState({
    downPct: 20,
    ratePct: 7.5,
    termYears: 30,
    includeRehabInLoan: false, // flip this on if you want purchase+rehab financed
    loanAmountOverride: 0, // if > 0, use this instead
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
        setEditForm({
            zip: data.zip || "",
            bedrooms: Number(data.bedrooms || 3),
            purchasePrice: Number(data.purchasePrice || 0),
            rehabCost: Number(data.rehabCost || 0),
            arv: Number(data.arv || 0),
        });          
        if (data?.assumptions) setAssumptions(data.assumptions);
        if (data?.loan) setLoan(data.loan);
        setHydrated(true);
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

  const saveAssumptions = async () => {
    if (!id) return;
  
    const res = await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assumptions }),
    });
  
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || "Failed to save assumptions");
      return;
    }
  
    alert("Saved ✅");
  };
  
  useEffect(() => {
    if (!id) return;
    if (!deal) return;
    if (!hydrated) return; // prevents save on initial load
  
    const timer = setTimeout(async () => {
      try {
        setSaveState("saving");
  
        const res = await fetch(`/api/deals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assumptions, loan }),
        });
  
        const data = await res.json().catch(() => ({}));
  
        if (!res.ok) {
          console.error("Autosave failed:", data?.error || res.statusText);
          setSaveState("error");
          return;
        }
  
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch (e) {
        console.error("Autosave error:", e);
        setSaveState("error");
      }
    }, 1000);
  
    return () => clearTimeout(timer);
  }, [assumptions, loan, id, deal, hydrated]);
  
  

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

  const saveAndRegenerate = async () => {
    if (!id) return;
  
    setEditLoading(true);
    try {
      // 1) Pull HUD rent
      const rentRes = await fetch(`/api/hud-rent?zip=${editForm.zip}&bedrooms=${editForm.bedrooms}`);
      const rentJson = await rentRes.json();
      if (!rentRes.ok) throw new Error(rentJson?.error || "HUD rent lookup failed");
  
      // 2) Regenerate memo
      const memoRes = await fetch("/api/deal-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: editForm.zip,
          bedrooms: editForm.bedrooms,
          purchasePrice: Number(editForm.purchasePrice),
          rehabCost: Number(editForm.rehabCost),
          arv: Number(editForm.arv),
          hudRent: Number(rentJson.rent),
        }),
      });
  
      const memoJson = await memoRes.json();
      if (!memoRes.ok) throw new Error(memoJson?.error || "Memo generation failed");
  
      // 3) Save updated deal fields
      const patchRes = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: editForm.zip,
          bedrooms: editForm.bedrooms,
          purchasePrice: Number(editForm.purchasePrice),
          rehabCost: Number(editForm.rehabCost),
          arv: Number(editForm.arv),
          hudRent: Number(rentJson.rent),
          memo: memoJson.memo,
        }),
      });
  
      const patchJson = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) throw new Error(patchJson?.error || "Save failed");
  
      // 4) Update local UI immediately (no refresh needed)
      setDeal((prev: any) => ({
        ...prev,
        zip: editForm.zip,
        bedrooms: editForm.bedrooms,
        purchasePrice: Number(editForm.purchasePrice),
        rehabCost: Number(editForm.rehabCost),
        arv: Number(editForm.arv),
        hudRent: Number(rentJson.rent),
        memo: memoJson.memo,
      }));
  
      setEditing(false);
    } catch (e: any) {
      alert(e?.message || "Error saving deal");
    } finally {
      setEditLoading(false);
    }
  };

  const monthlyPayment = (principal: number, annualRatePct: number, years: number) => {
    const r = (annualRatePct / 100) / 12;
    const n = years * 12;
  
    if (principal <= 0 || years <= 0) return 0;
    if (r === 0) return principal / n;
  
    const pow = Math.pow(1 + r, n);
    return principal * (r * pow) / (pow - 1);
  };
  

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!deal) return <p>Loading…</p>;

  const purchase = Number(deal.purchasePrice || 0);
  const rehab = Number(deal.rehabCost || 0);
  const arv = Number(deal.arv || 0);
  const rent = Number(deal.hudRent || 0);

  const totalInvestment = purchase + rehab;
  const baseLoanTarget = loan.includeRehabInLoan ? totalInvestment : purchase;
  const downPayment = baseLoanTarget * (loan.downPct / 100);
  const calculatedLoanAmount = Math.max(baseLoanTarget - downPayment, 0);

  const loanAmount = loan.loanAmountOverride > 0 ? Number(loan.loanAmountOverride) : calculatedLoanAmount;

  const piMonthly = monthlyPayment(loanAmount, loan.ratePct, loan.termYears);
 
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
          {editing && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid gap-3 md:grid-cols-5 text-sm">
                <input
                    className="input"
                    placeholder="ZIP"
                    value={editForm.zip}
                    onChange={(e) => updateEdit("zip", e.target.value)}
                />

                <input
                    className="input"
                    type="number"
                    placeholder="Bedrooms"
                    value={editForm.bedrooms}
                    onChange={(e) => updateEdit("bedrooms", Number(e.target.value))}
                />

                <input
                    className="input"
                    type="number"
                    placeholder="Purchase Price"
                    value={editForm.purchasePrice}
                    onChange={(e) => updateEdit("purchasePrice", Number(e.target.value))}
                />

                <input
                    className="input"
                    type="number"
                    placeholder="Rehab Cost"
                    value={editForm.rehabCost}
                    onChange={(e) => updateEdit("rehabCost", Number(e.target.value))}
                />

                <input
                    className="input"
                    type="number"
                    placeholder="ARV"
                    value={editForm.arv}
                    onChange={(e) => updateEdit("arv", Number(e.target.value))}
                />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                <button
                    onClick={saveAndRegenerate}
                    disabled={editLoading}
                    className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
                >
                    {editLoading ? "Saving..." : "Save & Regenerate Memo"}
                </button>

                <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
                >
                    Cancel
                </button>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                This will re-pull HUD rent and regenerate the AI memo using your updated numbers.
                </div>
            </div>
            )}

          <div className="flex items-center gap-2">
            <button
              onClick={exportPdf}
              className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
            >
              Export PDF
            </button>

            <button
              onClick={deleteDeal}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50">
              Delete
            </button>
            <button onClick={() => setEditing((v) => !v)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50">
                {editing ? "Close" : "Edit Deal"}
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
        <div className="text-xs">
            {saveState === "saving" && <span className="text-gray-600">Saving…</span>}
            {saveState === "saved" && <span className="text-green-700">Saved</span>}
            {saveState === "error" && <span className="text-red-700">Save failed</span>}
        </div>

        <button onClick={saveAssumptions} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">
        Save assumptions
        </button>

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
        <div className="mt-6 rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <div className="font-semibold">Loan Calculator (P&I)</div>
            <div className="text-xs text-gray-500">
                Use this to auto-fill Debt Service for cashflow + DSCR.
            </div>
            </div>

            <button
            type="button"
            onClick={() =>
                setAssumptions((a) => ({ ...a, debtServiceMonthly: Math.round(piMonthly) }))
            }
            className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90"
            >
            Use as Debt Service
            </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5 text-sm">
            <label className="space-y-1">
            <div className="text-gray-600">Down %</div>
            <input
                type="number"
                className="input"
                value={loan.downPct}
                onChange={(e) => setLoan({ ...loan, downPct: Number(e.target.value) })}
            />
            </label>

            <label className="space-y-1">
            <div className="text-gray-600">Rate %</div>
            <input
                type="number"
                step="0.1"
                className="input"
                value={loan.ratePct}
                onChange={(e) => setLoan({ ...loan, ratePct: Number(e.target.value) })}
            />
            </label>

            <label className="space-y-1">
            <div className="text-gray-600">Term (yrs)</div>
            <input
                type="number"
                className="input"
                value={loan.termYears}
                onChange={(e) => setLoan({ ...loan, termYears: Number(e.target.value) })}
            />
            </label>

            <label className="space-y-1">
            <div className="text-gray-600">Loan Override</div>
            <input
                type="number"
                className="input"
                value={loan.loanAmountOverride}
                onChange={(e) => setLoan({ ...loan, loanAmountOverride: Number(e.target.value) })}
                placeholder="0 = auto"
            />
            </label>

            <label className="space-y-1">
            <div className="text-gray-600">Include rehab?</div>
            <select
                className="input"
                value={loan.includeRehabInLoan ? "yes" : "no"}
                onChange={(e) => setLoan({ ...loan, includeRehabInLoan: e.target.value === "yes" })}
            >
                <option value="no">No</option>
                <option value="yes">Yes</option>
            </select>
            </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Loan Amount</div>
            <div className="font-semibold">{fmtMoney(loanAmount)}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">Down Payment</div>
            <div className="font-semibold">{fmtMoney(downPayment)}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-gray-600">P&I (Monthly)</div>
            <div className="font-semibold">{fmtMoney(piMonthly)}</div>
            </div>
        </div>
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
