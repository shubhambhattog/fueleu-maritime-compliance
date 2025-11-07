"use client";

import { useEffect, useState } from "react";
import { api, type CBResult, type BankEntry } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TrendingUp, TrendingDown, Minus, Wallet, ArrowUpCircle, ArrowDownCircle, Ship, CalendarIcon, ChevronsUpDown, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KPICardsSkeleton, TableSkeleton } from "@/components/skeletons";

export default function BankingTab() {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [cbData, setCbData] = useState<CBResult | null>(null);
  const [bankRecords, setBankRecords] = useState<BankEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  
  // Bank form
  const [bankAmount, setBankAmount] = useState("");
  const [applyAmount, setApplyAmount] = useState("");

  // Get filtered years based on selected ship
  const availableYears = shipId
    ? [...new Set(allRoutes.filter(r => r.shipId === shipId).map(r => r.year))].sort((a, b) => b - a)
    : [...new Set(allRoutes.map(r => r.year))].sort((a, b) => b - a);

  // Get filtered ships based on selected year
  const availableShips = year
    ? [...new Set(allRoutes.filter(r => r.year === year).map(r => r.shipId))].sort()
    : [...new Set(allRoutes.map(r => r.shipId))].sort();

  // Fetch all routes on mount
  useEffect(() => {
    const fetchAvailableOptions = async () => {
      try {
        const routes = await api.getRoutes();
        setAllRoutes(routes);
        
        // Set defaults
        if (routes.length > 0) {
          const firstShip = routes[0].shipId;
          const firstYear = routes[0].year;
          setShipId(firstShip);
          setYear(firstYear);
        }
      } catch (err: any) {
        toast.error("Failed to fetch available options", {
          description: err.message,
        });
      }
    };
    
    fetchAvailableOptions();
  }, []);

  // Reset year if it's not available for the selected ship
  useEffect(() => {
    if (shipId && year) {
      const isYearValid = allRoutes.some(r => r.shipId === shipId && r.year === year);
      if (!isYearValid && availableYears.length > 0) {
        setYear(availableYears[0]);
      }
    }
  }, [shipId, allRoutes]);

  // Reset ship if it's not available for the selected year
  useEffect(() => {
    if (year && shipId) {
      const isShipValid = allRoutes.some(r => r.year === year && r.shipId === shipId);
      if (!isShipValid && availableShips.length > 0) {
        setShipId(availableShips[0]);
      }
    }
  }, [year, allRoutes]);

  const handleReset = () => {
    setShipId("");
    setYear(null);
    setCbData(null);
    setBankRecords([]);
    setError(null);
    toast.success("Selection reset", {
      description: "Ship and year selections have been cleared",
    });
  };

  const fetchData = async () => {
    if (!shipId || !year) {
      toast.error("Missing information", {
        description: "Please select both ship ID and year",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cb, records] = await Promise.all([
        api.getCB(shipId, year),
        api.getBankingRecords(shipId, year),
      ]);
      setCbData(cb);
      setBankRecords(records);
      toast.success("Data fetched successfully", {
        description: `Loaded compliance data for ${shipId} in ${year}`,
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch banking data";
      setError(errorMessage);
      toast.error("Failed to fetch data", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBank = async () => {
    if (!bankAmount || !cbData || !year) return;
    try {
      const amountGrams = parseFloat(bankAmount) * 1_000_000; // convert tonnes to grams
      await api.bankSurplus(shipId, year, amountGrams);
      toast.success("Surplus banked successfully!", {
        description: `Banked ${parseFloat(bankAmount).toFixed(3)} tonnes for ${shipId}`,
      });
      setBankAmount("");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to bank surplus", {
        description: err.message || "An error occurred",
      });
    }
  };

  const handleApply = async () => {
    if (!applyAmount || !year) return;
    try {
      const amountGrams = parseFloat(applyAmount) * 1_000_000; // convert tonnes to grams
      await api.applyBanked(shipId, year, amountGrams);
      toast.success("Banked surplus applied successfully!", {
        description: `Applied ${parseFloat(applyAmount).toFixed(3)} tonnes for ${shipId}`,
      });
      setApplyAmount("");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to apply banked surplus", {
        description: err.message || "An error occurred",
      });
    }
  };

  const totalBanked = bankRecords.filter(r => r.type === "bank").reduce((s, r) => s + r.amount_g, 0);
  const totalApplied = bankRecords.filter(r => r.type === "apply").reduce((s, r) => s + r.amount_g, 0);
  const availableBanked = totalBanked - totalApplied;

  const canBank = cbData && cbData.cb_g > 0;
  const canApply = availableBanked > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Banking</h2>
        <Badge variant="outline" className="text-xs">Article 20</Badge>
      </div>

      {/* Ship/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Ship & Year</CardTitle>
          <CardDescription>Fetch compliance balance data for a specific ship and year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="w-[300px]">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Ship ID
              </label>
              <Popover open={shipOpen} onOpenChange={setShipOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={shipOpen}
                    className="w-full justify-between"
                  >
                    {shipId ? shipId : "Select ship..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search ship..." />
                    <CommandList>
                      <CommandEmpty>No ship found.</CommandEmpty>
                      <CommandGroup>
                        {availableShips.map((ship) => (
                          <CommandItem
                            key={ship}
                            value={ship}
                            onSelect={(currentValue) => {
                              setShipId(currentValue);
                              setShipOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                shipId === ship ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {ship}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-[300px]">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Year
              </label>
              <Popover open={yearOpen} onOpenChange={setYearOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={yearOpen}
                    className="w-full justify-between"
                  >
                    {year ? year : "Select year..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search year..." />
                    <CommandList>
                      <CommandEmpty>No year found.</CommandEmpty>
                      <CommandGroup>
                        {availableYears.map((y) => (
                          <CommandItem
                            key={y}
                            value={String(y)}
                            onSelect={() => {
                              setYear(y);
                              setYearOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                year === y ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {y}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={fetchData} size="lg" disabled={!shipId || !year} className="w-auto">
              Fetch Data
            </Button>
            <Button onClick={handleReset} size="lg" variant="outline" title="Reset selections" className="w-auto px-3">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <KPICardsSkeleton count={3} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          <TableSkeleton rows={5} columns={4} />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Data Content - Only show when loaded and no error */}
      {!loading && !error && cbData && (
        <>
          {/* CB Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Current Compliance Balance</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  {cbData.cb_g > 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : cbData.cb_g < 0 ? (
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  ) : (
                    <Minus className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                  )}
                  {cbData.cb_t.toFixed(3)} t
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{cbData.cb_g.toLocaleString()} g CO₂eq</div>
                <Badge variant={cbData.cb_g > 0 ? "secondary" : cbData.cb_g < 0 ? "destructive" : "outline"} className="mt-2">
                  {cbData.cb_g > 0 ? "Surplus" : cbData.cb_g < 0 ? "Deficit" : "Neutral"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available Banked Surplus</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  {(availableBanked / 1_000_000).toFixed(3)} t
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{availableBanked.toLocaleString()} g CO₂eq</div>
                <Badge variant="outline" className="mt-2">
                  {availableBanked > 0 ? "Available" : "None"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Banking Activity</CardDescription>
                <CardTitle className="text-3xl">{bankRecords.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {bankRecords.filter(r => r.type === "bank").length} banked, {bankRecords.filter(r => r.type === "apply").length} applied
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Surplus Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5" />
                  Bank Surplus
                </CardTitle>
                <CardDescription>Store positive compliance balance for future use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Amount (tonnes)</label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={bankAmount} 
                    onChange={(e: any) => setBankAmount(e.target.value)} 
                    disabled={!canBank} 
                    placeholder="0.000"
                    className="w-[300px]"
                  />
                </div>
                <Button onClick={handleBank} disabled={!canBank || !bankAmount} className="w-[300px]">
                  Bank Surplus
                </Button>
                {!canBank && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>No positive compliance balance available to bank</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Apply Banked Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5" />
                  Apply Banked Surplus
                </CardTitle>
                <CardDescription>Use previously banked surplus to cover deficits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Amount (tonnes)</label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={applyAmount} 
                    onChange={(e: any) => setApplyAmount(e.target.value)} 
                    disabled={!canApply} 
                    placeholder="0.000"
                    className="w-[300px]"
                  />
                </div>
                <Button onClick={handleApply} disabled={!canApply || !applyAmount} className="w-[300px]">
                  Apply Banked
                </Button>
                {!canApply && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>No banked surplus available to apply</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Banking History */}
          <Card>
            <CardHeader>
              <CardTitle>Banking History</CardTitle>
              <CardDescription>Transaction history for {shipId} in {year}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <tr className="bg-zinc-100 dark:bg-zinc-800">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount (t)</TableHead>
                    <TableHead className="text-right">Amount (g)</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {bankRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.type === "bank" ? (
                          <Badge variant="secondary" className="gap-1">
                            <ArrowDownCircle className="h-3 w-3" />
                            Bank
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1">
                            <ArrowUpCircle className="h-3 w-3" />
                            Apply
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">
                        {(record.amount_g / 1_000_000).toFixed(3)}
                      </TableCell>
                      <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">
                        {record.amount_g.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bankRecords.length === 0 && (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  No banking records found for this ship/year.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
