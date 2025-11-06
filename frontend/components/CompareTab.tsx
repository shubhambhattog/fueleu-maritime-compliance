"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    target: TARGET_INTENSITY,
  }));

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
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">GHG Intensity Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={TARGET_INTENSITY} stroke="red" strokeDasharray="3 3" label="Target" />
              <Bar dataKey="baseline" fill="#8884d8" name="Baseline" />
              <Bar dataKey="comparison" fill="#82ca9d" name="Comparison" />
            </BarChart>
          </ResponsiveContainer>
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
