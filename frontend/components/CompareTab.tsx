"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

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
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Target Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Target GHG Intensity:</strong> {TARGET_INTENSITY.toFixed(4)} gCO₂e/MJ (2% below 91.16)
        </p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">GHG Intensity Comparison</h3>
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
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Route ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Vessel Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fuel Type</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Baseline<br/>GHG (gCO₂e/MJ)</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Comparison<br/>GHG (gCO₂e/MJ)</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">% Difference</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">Compliant</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp, idx) => (
              <tr key={idx} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">{comp.comparison?.routeId || "-"}</td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{comp.comparison?.vesselType || "-"}</td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{comp.comparison?.fuelType || "-"}</td>
                <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                  {comp.baseline?.ghgIntensity?.toFixed(2) || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                  {comp.comparison?.ghgIntensity?.toFixed(2) || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                  {comp.percentDiff !== null ? `${comp.percentDiff.toFixed(2)}%` : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  {comp.compliant !== null ? (
                    comp.compliant ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                        ✅ Compliant
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                        ❌ Non-Compliant
                      </span>
                    )
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparisons.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          No comparison data found. Make sure a baseline is set in the Routes tab.
        </div>
      )}
    </div>
  );
}
