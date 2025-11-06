"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bar, Line, CartesianGrid, XAxis, YAxis, ReferenceLine, ComposedChart } from "recharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type Comparison = {
  baseline: any;
  comparison: any;
  percentDiff: number | null;
  compliant: boolean | null;
};

const TARGET_INTENSITY = 89.3368; // gCO2e/MJ (2% below 91.16)

export default function CompareTab() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(2024);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComparison(year);
      setComparisons(data.comparisons);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [year]);

  // Prepare chart data
  const chartData = comparisons.map((c, idx) => ({
    name: c.comparison?.routeId || `Route ${idx + 1}`,
    baseline: c.baseline?.ghgIntensity || 0,
    comparison: c.comparison?.ghgIntensity || 0,
  }));

  const chartConfig = {
    baseline: {
      label: "Baseline",
      theme: {
        light: "hsl(217 91% 60%)",
        dark: "hsl(217 91% 75%)",
      },
    },
    comparison: {
      label: "Comparison",
      theme: {
        light: "hsl(142 71% 45%)",
        dark: "hsl(142 71% 70%)",
      },
    },
  } satisfies ChartConfig;

  if (loading) return <div className="text-center py-8">Loading comparison data...</div>;
  if (error) return <div className="text-red-600 text-center py-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Compare Routes</h2>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Year:</label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger size="sm">
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"2024"}>2024</SelectItem>
              <SelectItem value={"2025"}>2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4">
        <p className="text-sm">
          <strong>Target GHG Intensity:</strong> {TARGET_INTENSITY.toFixed(4)} gCO₂e/MJ (2% below 91.16)
        </p>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>GHG Intensity Comparison</CardTitle>
            <CardDescription>
              Baseline vs Comparison Routes for {year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ComposedChart 
                accessibilityLayer 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                barGap={4}
                barCategoryGap="15%"
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft' }}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <ReferenceLine 
                  y={TARGET_INTENSITY} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Target', 
                    position: 'insideTopRight',
                    fill: '#71717a',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                />
                {/* Bar charts */}
                <Bar 
                  dataKey="baseline" 
                  fill="var(--color-baseline)" 
                  radius={[4, 4, 0, 0]}
                  barSize={35}
                  fillOpacity={0.8}
                  activeBar={{ 
                    fill: "var(--color-baseline)",
                    fillOpacity: 1,
                  }}
                />
                <Bar 
                  dataKey="comparison" 
                  fill="var(--color-comparison)" 
                  radius={[4, 4, 0, 0]}
                  barSize={35}
                  fillOpacity={0.8}
                  activeBar={{ 
                    fill: "var(--color-comparison)",
                    fillOpacity: 1,
                  }}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <TableHead>Route ID</TableHead>
            <TableHead>Vessel Type</TableHead>
            <TableHead>Fuel Type</TableHead>
            <TableHead className="text-right">Baseline<br/>GHG (gCO₂e/MJ)</TableHead>
            <TableHead className="text-right">Comparison<br/>GHG (gCO₂e/MJ)</TableHead>
            <TableHead className="text-right">% Difference</TableHead>
            <TableHead className="text-center">Compliant</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {comparisons.map((comp, idx) => (
            <TableRow key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <TableCell className="text-sm text-zinc-900 dark:text-zinc-50">{comp.comparison?.routeId || "-"}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{comp.comparison?.vesselType || "-"}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{comp.comparison?.fuelType || "-"}</TableCell>
              <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">{comp.baseline?.ghgIntensity?.toFixed(2) || "-"}</TableCell>
              <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">{comp.comparison?.ghgIntensity?.toFixed(2) || "-"}</TableCell>
              <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">{comp.percentDiff !== null ? `${comp.percentDiff.toFixed(2)}%` : "-"}</TableCell>
              <TableCell className="text-center">
                {comp.compliant !== null ? (
                  comp.compliant ? (
                    <Badge variant="secondary">✅ Compliant</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Non-Compliant</Badge>
                  )
                ) : (
                  <span className="text-zinc-400">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {comparisons.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          No comparison data found. Make sure a baseline is set in the Routes tab.
        </div>
      )}
    </div>
  );
}
