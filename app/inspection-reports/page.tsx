"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InspectionReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inspection-reports");
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load inspection reports");
          setReports([]);
          return;
        }

        setReports(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || "Client error");
        setReports([]);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Inspection Reports</h1>
        <p className="mt-2 text-gray-700">
          Saved pre-inspection reports generated from your checklist and AI analysis.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && reports.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          No inspection reports yet. Create one in{" "}
          <Link className="underline" href="/inspection-readiness">
            Inspection Readiness
          </Link>
          .
        </div>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <Link
            key={r.reportId}
            href={`/inspection-reports/${r.reportId}`}
            className="block rounded-xl bg-white p-4 shadow hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">Score: {r.score}/100</div>
              <div className="text-xs text-gray-500">
                {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
              </div>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              {r.notes ? `Notes: ${String(r.notes).slice(0, 80)}${String(r.notes).length > 80 ? "…" : ""}` : "No notes"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
