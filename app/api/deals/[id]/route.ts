import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
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

    const pk = `USER#${userId}`;
    const sk = `DEAL#${id}`;

    const result = await ddb.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk, sk },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json(result.Item);
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
  
      const hasAssumptions = body?.assumptions && typeof body.assumptions === "object";
      const hasLoan = body?.loan && typeof body.loan === "object";
  
      if (!hasAssumptions && !hasLoan) {
        return NextResponse.json(
          { error: "Provide assumptions and/or loan object" },
          { status: 400 }
        );
      }
  
      const pk = `USER#${userId}`;
      const sk = `DEAL#${id}`;
  
      const sets: string[] = ["updatedAt = :u"];
      const values: Record<string, any> = { ":u": new Date().toISOString() };
  
      if (hasAssumptions) {
        sets.push("assumptions = :a");
        values[":a"] = body.assumptions;
      }
      if (hasLoan) {
        sets.push("loan = :l");
        values[":l"] = body.loan;
      }
  
      await ddb.send(
        new UpdateCommand({
          TableName: requireTable(),
          Key: { pk, sk },
          UpdateExpression: `SET ${sets.join(", ")}`,
          ExpressionAttributeValues: values,
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

    const pk = `USER#${userId}`;
    const sk = `DEAL#${id}`;

    await ddb.send(
      new DeleteCommand({
        TableName: requireTable(),
        Key: { pk, sk },
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
