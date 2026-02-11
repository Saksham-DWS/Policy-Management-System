import { api } from "@/lib/api";
import { formatCurrencyValue } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export default function Reports() {
  const { data, isLoading } = api.reports.getOverview.useQuery({ months: 6 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  } 

  const totals = data?.totals || {
    totalCredits: 0,
    totalCreditsByCurrency: { USD: 0, INR: 0 },
    totalRedemptions: 0,
    totalRedemptionsByCurrency: { USD: 0, INR: 0 },
    pendingApprovals: 0,
    pendingSignatures: 0,
    pendingRedemptions: 0,
  };
 
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Credits (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrencyValue(totals.totalCreditsByCurrency?.USD || 0, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Credits (INR)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrencyValue(totals.totalCreditsByCurrency?.INR || 0, "INR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Redemptions (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrencyValue(totals.totalRedemptionsByCurrency?.USD || 0, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Redemptions (INR)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrencyValue(totals.totalRedemptionsByCurrency?.INR || 0, "INR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.pendingApprovals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.pendingSignatures}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pending Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.pendingRedemptions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credits Issued (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                USD: {
                  label: "USD",
                  color: "#2563eb",
                },
                INR: {
                  label: "INR",
                  color: "#16a34a",
                },
              }}
            >
              <BarChart data={data?.creditsByMonth || []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="USD" fill="var(--color-USD)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="INR" fill="var(--color-INR)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redemptions Paid (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                USD: {
                  label: "USD",
                  color: "#f97316",
                },
                INR: {
                  label: "INR",
                  color: "#7c3aed",
                },
              }}
            >
              <BarChart data={data?.redemptionsByMonth || []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="USD" fill="var(--color-USD)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="INR" fill="var(--color-INR)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Policies</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topPolicies?.length ? (
              <div className="space-y-3">
                {data.topPolicies.map((policy) => (
                  <div key={policy.policyId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{policy.name}</p>
                      <p className="text-sm text-muted-foreground">Requests: {policy.requests}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No policy activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Types</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.employeeTypes?.length ? (
              <div className="space-y-3">
                {data.employeeTypes.map((entry) => (
                  <div key={entry.type} className="flex items-center justify-between">
                    <p className="font-medium">{entry.type.replace("_", " ")}</p>
                    <p className="text-sm text-muted-foreground">{entry.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No employee data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
