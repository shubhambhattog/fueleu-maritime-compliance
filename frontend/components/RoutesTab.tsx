"use client";

import { useEffect, useState } from "react";
import { api, type RouteRecord } from "@/lib/api";

export default function RoutesTab() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | undefined>();
  const [vesselType, setVesselType] = useState("");
  const [fuelType, setFuelType] = useState("");

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRoutes({ shipId: shipId || undefined, year, vesselType: vesselType || undefined, fuelType: fuelType || undefined });
      setRoutes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSetBaseline = async (routeId: string) => {
    try {
      await api.setBaseline(routeId);
      fetchRoutes(); // refresh
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleApplyFilters = () => {
    fetchRoutes();
  };

  if (loading) return <div className="text-center py-8">Loading routes...</div>;
  if (error) return <div className="text-red-600 text-center py-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Routes</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <input
          type="text"
          placeholder="Ship ID"
          value={shipId}
          onChange={(e) => setShipId(e.target.value)}
          className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
        />
        <input
          type="number"
          placeholder="Year"
          value={year || ""}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
        />
        <input
          type="text"
          placeholder="Vessel Type"
          value={vesselType}
          onChange={(e) => setVesselType(e.target.value)}
          className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
        />
        <input
          type="text"
          placeholder="Fuel Type"
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value)}
          className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
        />
        <button
          onClick={handleApplyFilters}
          className="md:col-span-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Route ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ship ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Vessel Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fuel Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Year</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">GHG Intensity<br/>(gCO₂e/MJ)</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fuel (t)</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Distance (km)</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Emissions (t)</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">Baseline</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">Action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.routeId} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">{route.routeId}</td>
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">{route.shipId}</td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{route.vesselType}</td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{route.fuelType}</td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{route.year}</td>
                <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">{route.ghgIntensity.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right text-zinc-600 dark:text-zinc-400">{route.fuelConsumption.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-zinc-600 dark:text-zinc-400">{route.distance?.toLocaleString() || "-"}</td>
                <td className="px-4 py-3 text-sm text-right text-zinc-600 dark:text-zinc-400">{route.totalEmissions?.toLocaleString() || "-"}</td>
                <td className="px-4 py-3 text-center text-sm">
                  {route.isBaseline ? (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      Baseline
                    </span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {!route.isBaseline && (
                    <button
                      onClick={() => handleSetBaseline(route.routeId)}
                      className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Set Baseline
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {routes.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          No routes found. Try adjusting filters.
        </div>
      )}
    </div>
  );
}
