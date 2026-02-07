"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function InspectionReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/inspection-reports/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) setError(data.error);
        else setReport(data);
      })
      .catch(() => setError("Failed to load report"));
  }, [id]);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!report) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Inspection Report</h1>
        <p className="mt-2 text-gray-700">
          Score: <span className="font-semibold">{report.score}/100</span> • Created:{" "}
          {report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm whitespace-pre-wrap">
        <h2 className="text-lg font-semibold">AI Pre-Inspection Report</h2>
        <div className="mt-4 text-gray-900">{report.aiReport}</div>
      </div>
    </div>
  );
}
