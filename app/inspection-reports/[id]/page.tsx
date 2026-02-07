"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function InspectionReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/inspection-reports/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load report");
          setReport(null);
          return;
        }

        setReport(data);
      } catch (e: any) {
        setError(e?.message || "Client error");
        setReport(null);
      }
    };

    load();
  }, [id]);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!report) return <p>Loading…</p>;

  const answeredCount = report?.answers ? Object.keys(report.answers).length : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Inspection Report</h1>
        <p className="mt-2 text-gray-700">
          Score: <span className="font-semibold">{report.score}/100</span> • Answered:{" "}
          <span className="font-semibold">{answeredCount}</span> • Created:{" "}
          <span className="font-semibold">
            {report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}
          </span>
        </p>

        {report.notes && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold mb-1">Notes</div>
            <div>{report.notes}</div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm whitespace-pre-wrap">
        <h2 className="text-lg font-semibold">AI Pre-Inspection Report</h2>
        <div className="mt-4 text-gray-900">{report.aiReport}</div>
      </div>
    </div>
  );
}
