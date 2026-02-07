import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();

    const reportId = randomUUID();
    const createdAt = new Date().toISOString();

    const item = {
      pk: `USER#${userId}`,
      sk: `INSPECTION#${reportId}`,
      reportId,
      createdAt,
      score: body.score,
      answers: body.answers,
      notes: body.notes || "",
      aiReport: body.aiReport || "",
    };

    await ddb.send(
      new PutCommand({
        TableName: requireTable(),
        Item: item,
      })
    );

    return NextResponse.json({ reportId });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET() {
  try {
    const userId = await requireUser();

    const result = await ddb.send(
      new QueryCommand({
        TableName: requireTable(),
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":prefix": "INSPECTION#",
        },
        ScanIndexForward: false,
        Limit: 50,
      })
    );

    return NextResponse.json(result.Items ?? []);
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
