import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">
          Analyze deals using HUD rent limits — in minutes.
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          VoucherFlow helps investors and landlords evaluate purchases, estimate
          rehab scope, and plan for voucher-based rentals with confidence.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/new-deal"
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Start a Deal
          </Link>
          <Link
            href="/hud-rent"
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Look up HUD Rent
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">HUD Rent Lookup</h2>
          <p className="mt-2 text-sm text-gray-600">
            Search voucher rent limits by location and bedroom count.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Deal Analyzer</h2>
          <p className="mt-2 text-sm text-gray-600">
            Compare flip vs voucher rental outcomes with clear ROI metrics.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Inspection Readiness</h2>
          <p className="mt-2 text-sm text-gray-600">
            Checklist scoring to reduce failed inspections and rework.
          </p>
        </div>
      </section>
    </div>
  );
}
