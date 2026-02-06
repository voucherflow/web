import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const tableName = process.env.DDB_TABLE_HUD_LOOKUPS!;

export async function POST(req: Request) {
  const body = await req.json();
  const dealId = randomUUID();

  const item = {
    pk: "DEAL",
    sk: dealId,
    dealId,
    ...body,
    createdAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: tableName, Item: item }));

  return NextResponse.json({ dealId });
}

export async function GET() {
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": "DEAL" },
      ScanIndexForward: false,
    })
  );

  return NextResponse.json(result.Items ?? []);
}
