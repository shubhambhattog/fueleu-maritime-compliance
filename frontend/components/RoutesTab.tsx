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
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SortField = keyof RouteRecord | null;
type SortDirection = "asc" | "desc";

export default function RoutesTab() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("year");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterOpen, setFilterOpen] = useState(false);

  // Filters
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | undefined>();
  const [vesselType, setVesselType] = useState("");
  const [fuelType, setFuelType] = useState("");
  
  // Quick search
  const [quickSearch, setQuickSearch] = useState("");

  const hasActiveFilters = shipId || year || vesselType || fuelType;

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRoutes({ shipId: shipId || undefined, year, vesselType: vesselType || undefined, fuelType: fuelType || undefined });
      setRoutes(data);
      setFilterOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setShipId("");
    setYear(undefined);
    setVesselType("");
    setFuelType("");
    fetchRoutes();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter routes by quick search (case-insensitive)
  const filteredRoutes = routes.filter((route) => {
    if (!quickSearch) return true;
    
    const searchLower = quickSearch.toLowerCase();
    return (
      route.routeId?.toLowerCase().includes(searchLower) ||
      route.shipId?.toLowerCase().includes(searchLower) ||
      route.vesselType?.toLowerCase().includes(searchLower) ||
      route.fuelType?.toLowerCase().includes(searchLower) ||
      String(route.year).includes(searchLower) ||
      String(route.ghgIntensity).includes(searchLower) ||
      String(route.fuelConsumption).includes(searchLower) ||
      String(route.distance || "").includes(searchLower) ||
      String(route.totalEmissions || "").includes(searchLower)
    );
  });

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    
    let comparison = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 inline opacity-0 group-hover:opacity-30 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 inline" />
    );
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Routes</h2>
        
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Quick search..."
              value={quickSearch}
              onChange={(e: any) => setQuickSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          {/* Filter Button */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[shipId, year, vesselType, fuelType].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter Routes</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Apply filters to narrow down the results
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ship ID</label>
                  <Input 
                    placeholder="e.g., S001" 
                    value={shipId} 
                    onChange={(e: any) => setShipId(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Year</label>
                  <Input 
                    type="number" 
                    placeholder="e.g., 2024" 
                    value={year || ""} 
                    onChange={(e: any) => setYear(e.target.value ? Number(e.target.value) : undefined)} 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Vessel Type</label>
                  <Input 
                    placeholder="e.g., Container" 
                    value={vesselType} 
                    onChange={(e: any) => setVesselType(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fuel Type</label>
                  <Input 
                    placeholder="e.g., HFO" 
                    value={fuelType} 
                    onChange={(e: any) => setFuelType(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={fetchRoutes} className="flex-1" size="sm">
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <TableHead className="group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("routeId")}>
              Route ID <SortIcon field="routeId" />
            </TableHead>
            <TableHead className="group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("shipId")}>
              Ship ID <SortIcon field="shipId" />
            </TableHead>
            <TableHead className="group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("vesselType")}>
              Vessel Type <SortIcon field="vesselType" />
            </TableHead>
            <TableHead className="group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("fuelType")}>
              Fuel Type <SortIcon field="fuelType" />
            </TableHead>
            <TableHead className="group cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("year")}>
              Year <SortIcon field="year" />
            </TableHead>
            <TableHead className="group text-right cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("ghgIntensity")}>
              GHG Intensity<br/>(gCO₂e/MJ) <SortIcon field="ghgIntensity" />
            </TableHead>
            <TableHead className="group text-right cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("fuelConsumption")}>
              Fuel (t) <SortIcon field="fuelConsumption" />
            </TableHead>
            <TableHead className="group text-right cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("distance")}>
              Distance (km) <SortIcon field="distance" />
            </TableHead>
            <TableHead className="group text-right cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleSort("totalEmissions")}>
              Emissions (t) <SortIcon field="totalEmissions" />
            </TableHead>
            <TableHead className="text-center">Baseline</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {sortedRoutes.map((route) => (
            <TableRow key={route.routeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <TableCell className="text-sm text-zinc-900 dark:text-zinc-50">{route.routeId}</TableCell>
              <TableCell className="text-sm text-zinc-900 dark:text-zinc-50">{route.shipId}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{route.vesselType}</TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{route.fuelType}</TableCell>
              <TableCell className="text-sm text-zinc-900 dark:text-zinc-50">
                <Badge 
                  variant="outline" 
                  className={route.year === 2024 ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700" : "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"}
                >
                  {route.year}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">{route.ghgIntensity.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{route.fuelConsumption.toLocaleString()}</TableCell>
              <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{route.distance?.toLocaleString() || "-"}</TableCell>
              <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{route.totalEmissions?.toLocaleString() || "-"}</TableCell>
              <TableCell className="text-center">
                {route.isBaseline ? (
                  <Badge variant="secondary">Baseline {route.year}</Badge>
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
