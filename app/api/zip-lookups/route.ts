import { NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, HUD_LOOKUPS_TABLE } from "@/lib/ddb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const zip = (searchParams.get("zip") || "").trim();

    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "zip must be 5 digits" }, { status: 400 });
    }

    if (!ddb || !HUD_LOOKUPS_TABLE) {
      return NextResponse.json({ error: "DynamoDB not configured" }, { status: 500 });
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: HUD_LOOKUPS_TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": `ZIP#${zip}` },
        Limit: 20,
        ScanIndexForward: false,
      })
    );

    return NextResponse.json({ zip, items: res.Items || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
