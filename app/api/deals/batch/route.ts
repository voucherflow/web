import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
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

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json({ error: "Missing ids[]" }, { status: 400 });
    }

    // DynamoDB BatchGet limit is 100 keys
    const keys = ids.slice(0, 25).map((id) => ({
      pk: `USER#${userId}`,
      sk: `DEAL#${id}`,
    }));

    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [requireTable()]: {
            Keys: keys,
          },
        },
      })
    );

    const items = res.Responses?.[requireTable()] ?? [];
    return NextResponse.json(items);
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
