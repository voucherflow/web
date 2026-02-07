"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";

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

  const exportPdf = () => {
    if (!report) return;

    const doc = new jsPDF();
    const lineHeight = 7;
    let y = 15;

    doc.setFontSize(16);
    doc.text("VoucherFlow Inspection Report", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Score: ${report.score}/100`, 14, y); y += lineHeight;
    doc.text(`Created: ${report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}`, 14, y); y += 10;

    // Notes
    if (report.notes) {
      doc.setFontSize(12);
      doc.text("Notes:", 14, y);
      y += 8;

      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(String(report.notes), 180);
      doc.text(noteLines, 14, y);
      y += noteLines.length * 5 + 6;
    }

    // AI Report
    doc.setFontSize(12);
    doc.text("AI Pre-Inspection Report:", 14, y);
    y += 8;

    doc.setFontSize(10);
    const aiText = String(report.aiReport || "");
    const aiLines = doc.splitTextToSize(aiText, 180);

    // Handle multi-page if needed
    for (let i = 0; i < aiLines.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(aiLines[i], 14, y);
      y += 5;
    }

    doc.save(`VoucherFlow_Inspection_${report.reportId}.pdf`);
  };

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!report) return <p>Loading…</p>;

  const answeredCount = report?.answers ? Object.keys(report.answers).length : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Inspection Report</h1>
            <p className="mt-2 text-gray-700">
              Score: <span className="font-semibold">{report.score}/100</span> • Answered:{" "}
              <span className="font-semibold">{answeredCount}</span> • Created:{" "}
              <span className="font-semibold">
                {report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}
              </span>
            </p>
          </div>

          <button
            onClick={exportPdf}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Export PDF
          </button>
        </div>

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
