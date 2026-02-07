import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { score, answers, notes } = await req.json();

    if (typeof score !== "number" || !answers) {
      return NextResponse.json({ error: "Missing score or answers" }, { status: 400 });
    }

    const prompt = `
You are a HUD Housing Quality Standards (HQS) inspection prep assistant for voucher landlords.

Given:
- Readiness score: ${score}/100
- Answers (Yes/No/Not sure): ${JSON.stringify(answers)}
- Optional notes: ${notes || ""}

Return a concise "Pre-Inspection Report" with:
1) Top likely fail items (prioritized)
2) Quick fixes (easy wins) vs contractor fixes
3) Suggested order of repairs (first 48 hours)
4) A short "Inspector-style summary" paragraph
Keep it practical, landlord-friendly, and avoid legal promises.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      report: completion.choices[0]?.message?.content ?? "No report generated.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
