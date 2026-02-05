import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");
  const bedrooms = searchParams.get("bedrooms");

  if (!zip || !bedrooms) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // For now, return a temporary mock value to confirm the route works
  const mockRent = 1000 + Number(bedrooms) * 150;

  return NextResponse.json({
    zip,
    bedrooms,
    rent: mockRent,
    source: "mock",
  });
}
