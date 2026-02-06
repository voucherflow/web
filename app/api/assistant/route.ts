import { NextResponse } from "next/server";
import OpenAI from "openai";
import { HUD_LANDLORD_KNOWLEDGE } from "@/data/hud-landlord-knowledge";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const system = `
You are VoucherFlow Assistant, a helpful expert on HUD Housing Choice Voucher (Section 8) landlord processes.
Use the provided knowledge base first.
If the knowledge base does not contain enough info, answer generally and suggest contacting the local PHA.
Be concise, actionable, and landlord-friendly.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `KNOWLEDGE BASE:\n${HUD_LANDLORD_KNOWLEDGE}\n\nQUESTION:\n${message}` },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No response.";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
