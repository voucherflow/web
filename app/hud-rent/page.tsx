"use client";
import { useState } from "react";

export default function HudRentPage() {
  const [zip, setZip] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [result, setResult] = useState<number | null>(null);

  const handleLookup = () => {
    // Mock result for now
    const mockRent = 950 + Number(bedrooms) * 150;
    setResult(mockRent);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">HUD Rent Lookup</h1>
        <p className="mt-2 text-gray-600">
          Enter a ZIP code and bedroom count to estimate voucher rent limits.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder="ZIP Code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="rounded-lg border p-2"
          />

          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="rounded-lg border p-2"
          >
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4 Bedrooms</option>
          </select>
        </div>

        <button
          onClick={handleLookup}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Look Up Rent
        </button>

        {result && (
          <div className="mt-6 rounded-lg bg-gray-100 p-4">
            <p className="text-lg font-semibold">
              Estimated Voucher Rent: ${result.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
