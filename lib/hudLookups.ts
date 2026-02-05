import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, HUD_LOOKUPS_TABLE } from "./ddb";

export type HudLookupItem = {
  pk: string;
  sk: string;
  zip: string;
  bedrooms: number;
  rent: number;
  source: string;
  areaName?: string | null;
  entityIdUsed?: string | null;
};

export async function getRecentHudLookups(limit = 10): Promise<HudLookupItem[]> {
  if (!ddb || !HUD_LOOKUPS_TABLE) return [];

  const res = await ddb.send(
    new QueryCommand({
      TableName: HUD_LOOKUPS_TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": "LOOKUP" },
      Limit: limit,
      ScanIndexForward: false, // newest first
    })
  );

  return (res.Items || []) as HudLookupItem[];
}
