"use client";

import { useEffect, useState } from "react";
import { api, type RouteRecord } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

  if (loading) return <div className="text-center py-8">Loading routes...</div>;
  if (error) return <div className="text-red-600 text-center py-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Routes</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <Input placeholder="Ship ID" value={shipId} onChange={(e: any) => setShipId(e.target.value)} />
        <Input type="number" placeholder="Year" value={year || ""} onChange={(e: any) => setYear(e.target.value ? Number(e.target.value) : undefined)} />
        <Input placeholder="Vessel Type" value={vesselType} onChange={(e: any) => setVesselType(e.target.value)} />
        <Input placeholder="Fuel Type" value={fuelType} onChange={(e: any) => setFuelType(e.target.value)} />
        <div className="md:col-span-4">
          <Button onClick={fetchRoutes} className="w-full">Apply Filters</Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <TableHead>Route ID</TableHead>
            <TableHead>Ship ID</TableHead>
            <TableHead>Vessel Type</TableHead>
            <TableHead>Fuel Type</TableHead>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">GHG Intensity<br/>(gCO₂e/MJ)</TableHead>
            <TableHead className="text-right">Fuel (t)</TableHead>
            <TableHead className="text-right">Distance (km)</TableHead>
            <TableHead className="text-right">Emissions (t)</TableHead>
            <TableHead className="text-center">Baseline</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {routes.map((route) => (
            <TableRow key={route.routeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <TableCell className="text-sm text-zinc-900 dark:text-zinc-50">{route.routeId}</TableCell>
              <TableCell className="text-sm text-zinc-900 dark:text-zinc-50">{route.shipId}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{route.vesselType}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{route.fuelType}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{route.year}</TableCell>
              <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">{route.ghgIntensity.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{route.fuelConsumption.toLocaleString()}</TableCell>
              <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{route.distance?.toLocaleString() || "-"}</TableCell>
              <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{route.totalEmissions?.toLocaleString() || "-"}</TableCell>
              <TableCell className="text-center">
                {route.isBaseline ? (
                  <Badge variant="secondary">Baseline</Badge>
                ) : (
                  <span className="text-zinc-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {!route.isBaseline && (
                  <Button size="sm" variant="outline" onClick={() => handleSetBaseline(route.routeId)}>
                    Set Baseline
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {routes.length === 0 && (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          No routes found. Try adjusting filters.
        </div>
      )}
    </div>
  );
}
