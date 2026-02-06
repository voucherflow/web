import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { zip, bedrooms, purchasePrice, rehabCost, arv, hudRent } = body;

    if (!zip || !bedrooms || !purchasePrice || !rehabCost || !arv || !hudRent) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const totalInvestment = purchasePrice + rehabCost;
    const annualRent = hudRent * 12;
    const grossYield = (annualRent / totalInvestment) * 100;

    const prompt = `
You are a real estate investment analyst writing a concise deal memo for a Section 8 rental investor.

Property ZIP: ${zip}
Bedrooms: ${bedrooms}
Purchase Price: $${purchasePrice.toLocaleString()}
Rehab Budget: $${rehabCost.toLocaleString()}
Total Investment: $${totalInvestment.toLocaleString()}
After Repair Value (ARV): $${arv.toLocaleString()}
Estimated HUD Rent: $${hudRent.toLocaleString()} / month
Annual Gross Rent: $${annualRent.toLocaleString()}
Gross Yield: ${grossYield.toFixed(2)}%

Write a 1-page style memo including:
• Overview of the deal
• Strengths
• Risks
• Cash flow outlook (high level)
• Recommendation (conservative tone)
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      memo: completion.choices[0]?.message?.content ?? "No response",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
