import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const tableName = process.env.DDB_TABLE_HUD_LOOKUPS;

function requireTable() {
  if (!tableName) throw new Error("Missing DDB_TABLE_HUD_LOOKUPS env var");
  return tableName;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const zip = String(searchParams.get("zip") || "").trim(); // optional
    const beds = Number(searchParams.get("beds") || "0"); // optional
    const maxRent = Number(searchParams.get("maxRent") || "0"); // optional

    // MVP: if zip is provided, do fast begins_with query
    // If zip not provided, we’ll return a small recent slice by querying a "catch-all" is NOT possible without GSI.
    // So: require zip for MVP search.
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json(
        { error: "zip is required (5 digits) for public search in MVP" },
        { status: 400 }
      );
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: requireTable(),
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": "VOUCHER_LISTING",
          ":skPrefix": `ZIP#${zip}#`,
        },
        Limit: 50,
        ScanIndexForward: false,
      })
    );

    let items = (res.Items ?? []).filter((x: any) => x.status === "AVAILABLE");

    // filters (optional)
    if (beds > 0) items = items.filter((x: any) => Number(x.beds || 0) >= beds);
    if (maxRent > 0) items = items.filter((x: any) => Number(x.rent || 0) <= maxRent);

    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
