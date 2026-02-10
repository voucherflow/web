import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const tableName = process.env.DDB_TABLE_HUD_LOOKUPS;

function requireTable() {
  if (!tableName) throw new Error("Missing DDB_TABLE_HUD_LOOKUPS env var");
  return tableName;
}

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function GET() {
  try {
    const userId = await requireUser();

    const res = await ddb.send(
      new QueryCommand({
        TableName: requireTable(),
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":prefix": "LISTING#",
        },
        ScanIndexForward: false,
        Limit: 100,
      })
    );

    return NextResponse.json(res.Items ?? []);
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();

    // minimal validation
    const zip = String(body.zip || "").trim();
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "zip must be 5 digits" }, { status: 400 });
    }

    const listingId = randomUUID();
    const now = new Date().toISOString();

    const status = (body.status || "AVAILABLE") as "AVAILABLE" | "PENDING" | "RENTED";
    const acceptsVouchers = Boolean(body.acceptsVouchers);

    const ownerItem = {
      pk: `USER#${userId}`,
      sk: `LISTING#${listingId}`,
      entityType: "LISTING",
      listingId,
      ownerUserId: userId,

      title: String(body.title || "").slice(0, 120),
      address1: String(body.address1 || "").slice(0, 120),
      city: String(body.city || "").slice(0, 60),
      state: String(body.state || "").slice(0, 2),
      zip,

      beds: Number(body.beds || 0),
      baths: Number(body.baths || 0),
      rent: Number(body.rent || 0),

      acceptsVouchers,
      status,

      createdAt: now,
      updatedAt: now,
    };

    const publicItem = {
      pk: "VOUCHER_LISTING",
      sk: `ZIP#${zip}#${listingId}`,
      entityType: "VOUCHER_LISTING",
      listingId,
      ownerUserId: userId,

      title: ownerItem.title,
      city: ownerItem.city,
      state: ownerItem.state,
      zip: ownerItem.zip,
      beds: ownerItem.beds,
      baths: ownerItem.baths,
      rent: ownerItem.rent,

      acceptsVouchers,
      status,

      createdAt: now,
      updatedAt: now,
    };

    // Write both (simple sequential writes; good for MVP)
    await ddb.send(
      new PutCommand({
        TableName: requireTable(),
        Item: ownerItem,
      })
    );

    await ddb.send(
      new PutCommand({
        TableName: requireTable(),
        Item: publicItem,
      })
    );

    return NextResponse.json({ listingId });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
