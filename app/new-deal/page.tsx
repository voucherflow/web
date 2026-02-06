"use client";

import { useState } from "react";

export default function NewDealPage() {
  const [form, setForm] = useState({
    zip: "",
    bedrooms: 3,
    purchasePrice: "",
    rehabCost: "",
    arv: "",
  });

  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  // ✅ Save deal to DynamoDB
  const saveDeal = async (memoText: string, hudRent: number) => {
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hudRent,
        memo: memoText,
      }),
    });
  };

  const generateMemo = async () => {
    setLoading(true);
    setMemo("");

    try {
      // 1. Get HUD rent
      const rentRes = await fetch(`/api/hud-rent?zip=${form.zip}&bedrooms=${form.bedrooms}`);
      const rentJson = await rentRes.json();
      if (!rentRes.ok) throw new Error(rentJson.error);

      // 2. Generate memo
      const memoRes = await fetch("/api/deal-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchasePrice: Number(form.purchasePrice),
          rehabCost: Number(form.rehabCost),
          arv: Number(form.arv),
          hudRent: rentJson.rent,
        }),
      });

      const memoJson = await memoRes.json();
      if (!memoRes.ok) throw new Error(memoJson.error);

      setMemo(memoJson.memo);

      // 3. Save deal AFTER memo is generated
      await saveDeal(memoJson.memo, rentJson.rent);

    } catch (e: any) {
      setMemo("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">New Deal Analysis</h1>
        <p className="mt-2 text-gray-700">
          Enter deal numbers and generate an AI investment memo using HUD rent data.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            placeholder="ZIP"
            onChange={(e) => update("zip", e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Bedrooms"
            onChange={(e) => update("bedrooms", Number(e.target.value))}
            className="input"
          />
          <input
            type="number"
            placeholder="Purchase Price"
            onChange={(e) => update("purchasePrice", e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Rehab Cost"
            onChange={(e) => update("rehabCost", e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="ARV"
            onChange={(e) => update("arv", e.target.value)}
            className="input"
          />
        </div>

        <button
          onClick={generateMemo}
          disabled={loading}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
        >
          {loading ? "Generating..." : "Generate Deal Memo"}
        </button>
      </div>

      {memo && (
        <div className="rounded-2xl bg-white p-6 shadow-sm whitespace-pre-wrap">
          <h2 className="text-lg font-semibold">AI Deal Memo</h2>
          <p className="mt-4 text-gray-900">{memo}</p>
        </div>
      )}
    </div>
  );
}
