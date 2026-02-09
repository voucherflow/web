export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getRecentHudLookups } from "@/lib/hudLookups";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const tableName = process.env.DDB_TABLE_HUD_LOOKUPS!;

async function getUserDeals(userId: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "DEAL#",
      },
      ScanIndexForward: false,
      Limit: 50,
    })
  );

  return result.Items ?? [];
}

export default async function DashboardPage() {
  const lookups = await getRecentHudLookups(10);

  const { userId } = await auth();
  const deals = userId ? await getUserDeals(userId) : [];

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const rents = deals
    .map((d: any) => Number(d.hudRent || 0))
    .filter((n: number) => n > 0);

  const avgRent = rents.length
    ? rents.reduce((a: number, b: number) => a + b, 0) / rents.length
    : 0;

  let capRates: number[] = [];
  let cashflows: number[] = [];

  for (const d of deals as any[]) {
    const purchase = Number(d.purchasePrice || 0);
    const rehab = Number(d.rehabCost || 0);
    const total = purchase + rehab;
    const rent = Number(d.hudRent || 0);
    const annualRent = rent * 12;
    const a = d.assumptions;

    if (!a || total <= 0) continue;

    const vacancy = annualRent * (Number(a.vacancyPct || 0) / 100);
    const repairs = annualRent * (Number(a.repairsPct || 0) / 100);
    const mgmt = annualRent * (Number(a.managementPct || 0) / 100);
    const capex = annualRent * (Number(a.capexPct || 0) / 100);

    const fixed =
      (Number(a.taxesMonthly || 0) +
        Number(a.insuranceMonthly || 0) +
        Number(a.hoaMonthly || 0)) *
      12;

    const noi = annualRent - (vacancy + repairs + mgmt + capex + fixed);
    capRates.push((noi / total) * 100);

    const debt = Number(a.debtServiceMonthly || 0) * 12;
    cashflows.push((noi - debt) / 12);
  }

  const avgCap = capRates.length
    ? capRates.reduce((a, b) => a + b, 0) / capRates.length
    : 0;

  const avgCashflow = cashflows.length
    ? cashflows.reduce((a, b) => a + b, 0) / cashflows.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-2 text-gray-700">
              Recent activity across VoucherFlow.
            </p>
          </div>

          <Link
            href="/new-deal"
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            New Deal
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 text-sm">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="text-gray-600">Deals</div>
          <div className="mt-2 text-2xl font-bold">{deals.length}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="text-gray-600">Avg HUD Rent</div>
          <div className="mt-2 text-2xl font-bold">{fmtMoney(avgRent)}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="text-gray-600">Avg Cap Rate</div>
          <div className="mt-2 text-2xl font-bold">{fmtPct(avgCap)}</div>
          <div className="mt-1 text-xs text-gray-500">
            Only deals with assumptions
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="text-gray-600">Avg Cashflow</div>
          <div
            className={`mt-2 text-2xl font-bold ${
              avgCashflow >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {fmtMoney(avgCashflow)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Only deals with assumptions
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Deals</h2>
          <Link href="/deals" className="text-sm underline">
            View all
          </Link>
        </div>

        {deals.length === 0 ? (
          <p className="mt-4 text-gray-700">
            No deals yet. Create one from{" "}
            <Link className="underline" href="/new-deal">
              New Deal
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {deals.slice(0, 8).map((d: any) => (
              <Link
                key={d.dealId}
                href={`/deals/${d.dealId}`}
                className="block rounded-xl border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {d.zip} • {d.bedrooms}BR
                  </div>
                  <div className="text-xs text-gray-500">
                    {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  Purchase: {fmtMoney(Number(d.purchasePrice || 0))} • Rehab:{" "}
                  {fmtMoney(Number(d.rehabCost || 0))} • Rent:{" "}
                  {fmtMoney(Number(d.hudRent || 0))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent HUD Rent Lookups</h2>
          <span className="text-sm text-gray-600">{lookups.length} shown</span>
        </div>

        {lookups.length === 0 ? (
          <p className="mt-4 text-gray-700">
            No lookups yet. Run a HUD Rent Lookup to see history here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">ZIP</th>
                  <th className="py-2 pr-4">Beds</th>
                  <th className="py-2 pr-4">Rent</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Area</th>
                </tr>
              </thead>
              <tbody>
                {lookups.map((x: any) => (
                  <tr key={`${x.pk}-${x.sk}`} className="border-b">
                    <td className="py-2 pr-4">
                      {new Date(x.sk).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{x.zip}</td>
                    <td className="py-2 pr-4">{x.bedrooms}</td>
                    <td className="py-2 pr-4 font-semibold">
                      ${Number(x.rent).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{x.source}</td>
                    <td className="py-2 pr-4">{x.areaName || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
