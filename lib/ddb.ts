import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION;

export const ddb =
  region
    ? DynamoDBDocumentClient.from(new DynamoDBClient({ region }))
    : null;

export const HUD_LOOKUPS_TABLE = process.env.DDB_TABLE_HUD_LOOKUPS;
