import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUser();
    const { id } = await params;

    const res = await ddb.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk: `USER#${userId}`, sk: `LISTING#${id}` },
      })
    );

    if (!res.Item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(res.Item);
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUser();
    const { id } = await params;
    const body = await req.json();

    // 1) Get existing owner record (we need zip to update public record key)
    const existing = await ddb.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk: `USER#${userId}`, sk: `LISTING#${id}` },
      })
    );

    if (!existing.Item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const prevZip = String(existing.Item.zip || "");
    const nextZip = body.zip !== undefined ? String(body.zip).trim() : prevZip;

    if (!/^\d{5}$/.test(nextZip)) {
      return NextResponse.json({ error: "zip must be 5 digits" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Allowed fields
    const allow = [
      "title",
      "address1",
      "city",
      "state",
      "zip",
      "beds",
      "baths",
      "rent",
      "acceptsVouchers",
      "status",
    ] as const;

    const sets: string[] = ["updatedAt = :u"];
    const values: Record<string, any> = { ":u": now };

    for (const key of allow) {
      if (body[key] !== undefined) {
        sets.push(`${key} = :${key}`);
        values[`:${key}`] =
          key === "beds" || key === "baths" || key === "rent"
            ? Number(body[key])
            : key === "acceptsVouchers"
              ? Boolean(body[key])
              : body[key];
      }
    }

    await ddb.send(
      new UpdateCommand({
        TableName: requireTable(),
        Key: { pk: `USER#${userId}`, sk: `LISTING#${id}` },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeValues: values,
      })
    );

    // 2) Update public record:
    // If zip changed, easiest MVP is: delete old public item, create a new one with new ZIP key.
    const prevPublicKey = { pk: "VOUCHER_LISTING", sk: `ZIP#${prevZip}#${id}` };
    const nextPublicKey = { pk: "VOUCHER_LISTING", sk: `ZIP#${nextZip}#${id}` };

    // delete old (ignore errors)
    await ddb.send(
      new DeleteCommand({
        TableName: requireTable(),
        Key: prevPublicKey,
      })
    );

    // rebuild public item from merged fields
    const merged = { ...existing.Item, ...body, zip: nextZip, updatedAt: now };

    const publicItem = {
      pk: nextPublicKey.pk,
      sk: nextPublicKey.sk,
      entityType: "VOUCHER_LISTING",
      listingId: id,
      ownerUserId: userId,

      title: String(merged.title || "").slice(0, 120),
      city: String(merged.city || "").slice(0, 60),
      state: String(merged.state || "").slice(0, 2),
      zip: String(merged.zip || ""),
      beds: Number(merged.beds || 0),
      baths: Number(merged.baths || 0),
      rent: Number(merged.rent || 0),

      acceptsVouchers: Boolean(merged.acceptsVouchers),
      status: (merged.status || "AVAILABLE") as string,

      createdAt: merged.createdAt || now,
      updatedAt: now,
    };

    await ddb.send(
      new UpdateCommand({
        TableName: requireTable(),
        Key: nextPublicKey,
        UpdateExpression:
          "SET entityType=:et, ownerUserId=:ou, listingId=:id, title=:t, city=:c, state=:s, zip=:z, beds=:b, baths=:ba, rent=:r, acceptsVouchers=:av, status=:st, createdAt=:ca, updatedAt=:ua",
        ExpressionAttributeValues: {
          ":et": "VOUCHER_LISTING",
          ":ou": userId,
          ":id": id,
          ":t": publicItem.title,
          ":c": publicItem.city,
          ":s": publicItem.state,
          ":z": publicItem.zip,
          ":b": publicItem.beds,
          ":ba": publicItem.baths,
          ":r": publicItem.rent,
          ":av": publicItem.acceptsVouchers,
          ":st": publicItem.status,
          ":ca": publicItem.createdAt,
          ":ua": publicItem.updatedAt,
        },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUser();
    const { id } = await params;

    // Get owner listing to know zip
    const existing = await ddb.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk: `USER#${userId}`, sk: `LISTING#${id}` },
      })
    );

    if (!existing.Item) {
      return NextResponse.json({ ok: true });
    }

    const zip = String(existing.Item.zip || "");

    await ddb.send(
      new DeleteCommand({
        TableName: requireTable(),
        Key: { pk: `USER#${userId}`, sk: `LISTING#${id}` },
      })
    );

    await ddb.send(
      new DeleteCommand({
        TableName: requireTable(),
        Key: { pk: "VOUCHER_LISTING", sk: `ZIP#${zip}#${id}` },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
