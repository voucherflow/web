import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, HUD_LOOKUPS_TABLE } from "./ddb";

export type HudLookupItem = {
  pk: string;
  sk: string; // ISO date
  zip: string;
  bedrooms: number;
  rent: number;
  source: string;
  areaName?: string | null;
};

export async function getRecentHudLookups(limit = 10): Promise<HudLookupItem[]> {
  if (!ddb || !HUD_LOOKUPS_TABLE) return [];

  // Simple MVP approach: Scan + sort in app
  // (Later we’ll model for Query to avoid scans)
  const res = await ddb.send(
    new ScanCommand({
      TableName: HUD_LOOKUPS_TABLE,
      Limit: 100, // grab a chunk then sort
    })
  );

  const items = (res.Items || []) as HudLookupItem[];

  return items
    .filter((x) => x?.sk)
    .sort((a, b) => (a.sk < b.sk ? 1 : -1))
    .slice(0, limit);
}
