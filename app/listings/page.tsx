"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ListingForm = {
  title: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  rent: number;
  acceptsVouchers: boolean;
  status: "AVAILABLE" | "PENDING" | "RENTED";
};

const empty: ListingForm = {
  title: "",
  address1: "",
  city: "",
  state: "MS",
  zip: "",
  beds: 3,
  baths: 2,
  rent: 0,
  acceptsVouchers: true,
  status: "AVAILABLE",
};

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [form, setForm] = useState<ListingForm>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const res = await fetch("/api/listings");
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Failed to load listings");
      setListings([]);
      return;
    }
    setListings(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (k: keyof ListingForm, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const createListing = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setForm(empty);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string, zip: string) => {
    if (!confirm("Delete this listing?")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data?.error || "Delete failed");
    await load();
  };

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Listings</h1>
            <p className="mt-2 text-gray-700">
              Create voucher-friendly listings for tenants to discover publicly.
            </p>
          </div>

          <Link href="/voucher-housing" className="text-sm underline">
            View public page
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Create Listing</h2>

        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <input className="input" placeholder="Title (optional)" value={form.title}
            onChange={(e) => update("title", e.target.value)} />
          <input className="input" placeholder="Address (optional)" value={form.address1}
            onChange={(e) => update("address1", e.target.value)} />
          <input className="input" placeholder="City" value={form.city}
            onChange={(e) => update("city", e.target.value)} />

          <input className="input" placeholder="State" value={form.state}
            onChange={(e) => update("state", e.target.value.toUpperCase())} />
          <input className="input" placeholder="ZIP (required)" value={form.zip}
            onChange={(e) => update("zip", e.target.value)} />
          <input className="input" type="number" placeholder="Rent" value={form.rent}
            onChange={(e) => update("rent", Number(e.target.value))} />

          <input className="input" type="number" placeholder="Beds" value={form.beds}
            onChange={(e) => update("beds", Number(e.target.value))} />
          <input className="input" type="number" placeholder="Baths" value={form.baths}
            onChange={(e) => update("baths", Number(e.target.value))} />

          <select className="input" value={form.status}
            onChange={(e) => update("status", e.target.value)}>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="PENDING">PENDING</option>
            <option value="RENTED">RENTED</option>
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.acceptsVouchers}
              onChange={(e) => update("acceptsVouchers", e.target.checked)}
            />
            Accepts vouchers ✅
          </label>
        </div>

        <button
          onClick={createListing}
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Your Listings</h2>

        {listings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-700">No listings yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {listings.map((x) => (
              <div
                key={x.listingId}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold">
                    {x.zip} • {x.beds}BR • {fmtMoney(Number(x.rent || 0))}
                    {x.acceptsVouchers ? (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Voucher OK
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => del(x.listingId, x.zip)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  {x.city ? `${x.city}, ${x.state}` : ""} • Status: {x.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
