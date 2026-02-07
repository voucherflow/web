"use client";

import { useMemo, useState } from "react";

type Choice = "yes" | "no" | "unsure";

type Question = {
  id: string;
  label: string;
  weight: number; // contributes to score
};

type Section = {
  title: string;
  description?: string;
  questions: Question[];
};

const SECTIONS: Section[] = [
  {
    title: "Life Safety",
    description: "The most common fail items relate to fire and carbon monoxide safety.",
    questions: [
      { id: "smoke_detectors", label: "Working smoke detectors installed (per bedroom level requirements)", weight: 8 },
      { id: "co_detectors", label: "Carbon monoxide detector installed (if required / best practice)", weight: 6 },
      { id: "egress_clear", label: "Clear egress paths (doors/windows not blocked, bedrooms have safe egress)", weight: 6 },
      { id: "handrails", label: "Handrails secure on stairs/steps where needed", weight: 5 },
    ],
  },
  {
    title: "Electrical",
    description: "Outlets, GFCI, exposed wiring, missing covers are frequent issues.",
    questions: [
      { id: "no_exposed_wiring", label: "No exposed wiring / unsafe connections", weight: 8 },
      { id: "outlet_covers", label: "All outlets/switches have cover plates", weight: 5 },
      { id: "gfci_near_water", label: "GFCI outlets near sinks / wet areas (kitchen/bath) working", weight: 7 },
      { id: "lights_work", label: "All lights/fixtures working; no flicker", weight: 4 },
    ],
  },
  {
    title: "Plumbing & Water",
    description: "Leaks, water heater issues, drainage and hot water are common fails.",
    questions: [
      { id: "no_leaks", label: "No leaks under sinks/toilets; visible plumbing is secure", weight: 8 },
      { id: "hot_water", label: "Reliable hot water available; water heater safe & functioning", weight: 7 },
      { id: "drainage_ok", label: "Sinks/tubs drain properly; no clogs/slow drains", weight: 5 },
      { id: "toilet_secure", label: "Toilet secure, flushes properly, no rocking", weight: 4 },
    ],
  },
  {
    title: "Windows, Doors, & Security",
    description: "Broken windows, missing locks, and poor weather sealing can cause issues.",
    questions: [
      { id: "windows_intact", label: "No broken glass; windows open/close", weight: 6 },
      { id: "locks_work", label: "Exterior doors lock properly; windows have working locks", weight: 6 },
      { id: "weather_seal", label: "Doors/windows reasonably sealed (no major gaps)", weight: 3 },
      { id: "screens_where_needed", label: "Screens present where required (if applicable)", weight: 2 },
    ],
  },
  {
    title: "Interior & Sanitation",
    description: "Trip hazards, peeling paint, and general sanitation matter.",
    questions: [
      { id: "no_trip_hazards", label: "No major trip hazards (loose flooring, broken steps, hazards)", weight: 6 },
      { id: "peeling_paint", label: "No peeling/chipping paint (especially pre-1978 risk)", weight: 7 },
      { id: "kitchen_working", label: "Kitchen area clean; appliances functional (if provided)", weight: 4 },
      { id: "bathroom_working", label: "Bathroom clean; ventilation reasonable; fixtures functional", weight: 4 },
    ],
  },
];

const OPTIONS: { value: Choice; label: string; score: number }[] = [
  { value: "yes", label: "Yes", score: 1 },
  { value: "unsure", label: "Not sure", score: 0.5 },
  { value: "no", label: "No", score: 0 },
];

function classify(score: number) {
  if (score >= 90) return { label: "Likely to pass", tone: "text-green-700 bg-green-50 border-green-200" };
  if (score >= 70) return { label: "Minor issues", tone: "text-amber-700 bg-amber-50 border-amber-200" };
  if (score >= 50) return { label: "Moderate risk", tone: "text-orange-700 bg-orange-50 border-orange-200" };
  return { label: "High fail risk", tone: "text-red-700 bg-red-50 border-red-200" };
}

export default function InspectionReadinessPage() {
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { score, answeredCount, totalCount } = useMemo(() => {
    let earned = 0;
    let possible = 0;
    let answered = 0;
    let total = 0;

    for (const section of SECTIONS) {
      for (const q of section.questions) {
        total += 1;
        possible += q.weight;

        const a = answers[q.id];
        if (a) {
          answered += 1;
          const opt = OPTIONS.find((o) => o.value === a)!;
          earned += q.weight * opt.score;
        }
      }
    }

    const pct = possible === 0 ? 0 : Math.round((earned / possible) * 100);
    return { score: pct, answeredCount: answered, totalCount: total };
  }, [answers]);

  const status = classify(score);

  const generateAiReport = async () => {
    setLoading(true);
    setError("");
    setReport("");

    try {
      const res = await fetch("/api/inspection-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, answers, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate report");

      setReport(data.report);
    } catch (e: any) {
      setError(e?.message || "Client error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Inspection Readiness</h1>
        <p className="mt-2 text-gray-700">
          Walk through a checklist and generate an AI pre-inspection report for HUD/Section 8 readiness.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className={`rounded-xl border px-4 py-2 text-sm ${status.tone}`}>
            <span className="font-semibold">Score:</span> {score}/100 • {status.label}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
            Answered {answeredCount}/{totalCount}
          </div>

          <button
            onClick={generateAiReport}
            disabled={loading || answeredCount === 0}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate AI Pre-Inspection Report"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {section.description && <p className="mt-1 text-sm text-gray-600">{section.description}</p>}

            <div className="mt-4 space-y-4">
              {section.questions.map((q) => (
                <div key={q.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="font-medium text-gray-900">{q.label}</div>
                    <div className="flex gap-2">
                      {OPTIONS.map((o) => {
                        const active = answers[q.id] === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                            className={[
                              "rounded-lg border px-3 py-1.5 text-sm",
                              active ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
                            ].join(" ")}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Weight: {q.weight} • Choose “Not sure” if you need to verify.
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Notes + AI report */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Notes (optional)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add context like “built 1975”, “tenant moved out”, “kitchen rehab pending”, etc.
        </p>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900"
          placeholder="Example: Property built in 1972. Replacing two windows next week. Smoke detectors already installed."
        />
      </div>

      {report && (
        <div className="rounded-2xl bg-white p-6 shadow-sm whitespace-pre-wrap">
          <h2 className="text-lg font-semibold">AI Pre-Inspection Report</h2>
          <div className="mt-4 text-gray-900">{report}</div>
        </div>
      )}
    </div>
  );
}
