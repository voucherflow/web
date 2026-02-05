import { NextResponse } from "next/server";

const HUD_FMR_BASE = "https://www.huduser.gov/hudapi/public/fmr";
const HUD_USPS_BASE = "https://www.huduser.gov/hudapi/public/usps";

function getToken() {
  const token = process.env.HUDUSER_TOKEN;
  if (!token) throw new Error("Missing HUDUSER_TOKEN (set in .env.local and Vercel env vars).");
  return token;
}

async function hudGet(url: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HUD API error ${res.status}: ${text}`);
  }

  return res.json();
}

// maps 0-4 to HUD keys
function bedroomKey(bedrooms: number) {
  if (bedrooms === 0) return "Efficiency";
  if (bedrooms === 1) return "One-Bedroom";
  if (bedrooms === 2) return "Two-Bedroom";
  if (bedrooms === 3) return "Three-Bedroom";
  if (bedrooms === 4) return "Four-Bedroom";
  return "Two-Bedroom";
}

function pickBest(results: any[]) {
  if (!Array.isArray(results) || results.length === 0) return null;
  return results
    .slice()
    .sort((a, b) => (b.res_ratio ?? 0) - (a.res_ratio ?? 0))[0];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zip = (searchParams.get("zip") || "").trim();
    const bedrooms = Number(searchParams.get("bedrooms") || "1");

    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "zip must be 5 digits" }, { status: 400 });
    }
    if (![0, 1, 2, 3, 4].includes(bedrooms)) {
      return NextResponse.json({ error: "bedrooms must be 0-4" }, { status: 400 });
    }

    // 1) ZIP -> CBSA
    const cbsaJson = await hudGet(`${HUD_USPS_BASE}?type=3&query=${zip}`);
    const cbsaResults = cbsaJson?.data?.results ?? cbsaJson?.data?.[0]?.results ?? [];
    const bestCbsa = pickBest(cbsaResults);

    let rent: number | null = null;
    let source: "SAFMR" | "FMR_METRO" | "FMR_COUNTY" = "FMR_COUNTY";
    let areaName: string | null = null;

    // 2) Try metro entity first (if CBSA exists)
    if (bestCbsa?.geoid) {
      const cbsa = String(bestCbsa.geoid);
      const metroEntityId = `METRO${cbsa}M${cbsa}`;

      try {
        const metroJson = await hudGet(`${HUD_FMR_BASE}/data/${metroEntityId}`);
        const data = metroJson?.data;

        areaName = data?.area_name || data?.metro_name || null;

        const key = bedroomKey(bedrooms);

        // SAFMR metro returns an array in basicdata with ZIP entries
        if (String(data?.smallarea_status) === "1" && Array.isArray(data?.basicdata)) {
          source = "SAFMR";
          const zipRow =
            data.basicdata.find((x: any) => String(x.zip_code) === zip) ||
            data.basicdata.find((x: any) => String(x.zip_code).toLowerCase().includes("msa"));
          rent = zipRow ? Number(zipRow[key]) : null;
        } else {
          source = "FMR_METRO";
          rent = data?.basicdata ? Number(data.basicdata[key]) : null;
        }
      } catch {
        // fall through to county
      }
    }

    // 3) County fallback (ZIP -> county geoid)
    if (!rent || Number.isNaN(rent)) {
      const countyJson = await hudGet(`${HUD_USPS_BASE}?type=2&query=${zip}`);
      const countyResults = countyJson?.data?.results ?? countyJson?.data?.[0]?.results ?? [];
      const bestCounty = pickBest(countyResults);

      if (!bestCounty?.geoid) {
        return NextResponse.json({ error: "Could not map ZIP to county/metro" }, { status: 404 });
      }

      const countyGeoid = String(bestCounty.geoid); // 5-digit
      const countyEntityId = `${countyGeoid}99999`;

      const countyFmrJson = await hudGet(`${HUD_FMR_BASE}/data/${countyEntityId}`);
      const data = countyFmrJson?.data;

      areaName = data?.county_name || null;

      const key = bedroomKey(bedrooms);
      rent = data?.basicdata ? Number(data.basicdata[key]) : null;
      source = "FMR_COUNTY";
    }

    if (!rent || Number.isNaN(rent)) {
      return NextResponse.json({ error: "Rent not found" }, { status: 404 });
    }

    return NextResponse.json({
      zip,
      bedrooms,
      rent,
      source,
      areaName,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
