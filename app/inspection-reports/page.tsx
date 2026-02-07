"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InspectionReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/inspection-reports");
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load reports");
        return;
      }

      setReports(Array.isArray(data) ? data : []);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inspection Reports</h1>

      {error && <p className="text-red-600">Error: {error}</p>}

      {reports.length === 0 && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          No inspection reports yet. Go to{" "}
          <Link className="underline" href="/inspection-readiness">
            Inspection Readiness
          </Link>{" "}
          to generate one.
        </div>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <Link
            key={r.reportId}
            href={`/inspection-reports/${r.reportId}`}
            className="block rounded-xl bg-white p-4 shadow hover:bg-gray-50"
          >
            <div className="font-semibold">Score: {r.score}/100</div>
            <div className="text-sm text-gray-600">
              Created: {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
