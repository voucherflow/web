import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, HUD_LOOKUPS_TABLE } from "./ddb";

export type ZipLookupItem = {
  pk: string;
  sk: string;
  zip: string;
  bedrooms: number;
  rent: number;
  source: string;
  areaName?: string | null;
};

export async function getZipLookups(zip: string, limit = 20): Promise<ZipLookupItem[]> {
  if (!ddb || !HUD_LOOKUPS_TABLE) return [];

  const res = await ddb.send(
    new QueryCommand({
      TableName: HUD_LOOKUPS_TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `ZIP#${zip}` },
      Limit: limit,
      ScanIndexForward: false, // newest first
    })
  );

  return (res.Items || []) as ZipLookupItem[];
}
