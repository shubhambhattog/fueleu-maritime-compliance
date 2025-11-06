"use client";

import { useEffect, useState } from "react";
import { api, type CBResult, type BankEntry } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function BankingTab() {
  const [shipId, setShipId] = useState("S001");
  const [year, setYear] = useState(2024);
  const [cbData, setCbData] = useState<CBResult | null>(null);
  const [bankRecords, setBankRecords] = useState<BankEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bank form
  const [bankAmount, setBankAmount] = useState("");
  const [applyAmount, setApplyAmount] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cb, records] = await Promise.all([
        api.getCB(shipId, year),
        api.getBankingRecords(shipId, year),
      ]);
      setCbData(cb);
      setBankRecords(records);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBank = async () => {
    if (!bankAmount || !cbData) return;
    try {
      const amountGrams = parseFloat(bankAmount) * 1_000_000; // convert tonnes to grams
      await api.bankSurplus(shipId, year, amountGrams);
      alert("Surplus banked successfully!");
      setBankAmount("");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleApply = async () => {
    if (!applyAmount) return;
    try {
      const amountGrams = parseFloat(applyAmount) * 1_000_000; // convert tonnes to grams
      await api.applyBanked(shipId, year, amountGrams);
      alert("Banked surplus applied successfully!");
      setApplyAmount("");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const totalBanked = bankRecords.filter(r => r.type === "bank").reduce((s, r) => s + r.amount_g, 0);
  const totalApplied = bankRecords.filter(r => r.type === "apply").reduce((s, r) => s + r.amount_g, 0);
  const availableBanked = totalBanked - totalApplied;

  const canBank = cbData && cbData.cb_g > 0;
  const canApply = availableBanked > 0;

  if (loading) return <div className="text-center py-8">Loading banking data...</div>;

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
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Ship ID</label>
              <Input value={shipId} onChange={(e: any) => setShipId(e.target.value)} placeholder="e.g., S001" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Year</label>
              <Input type="number" value={year} onChange={(e: any) => setYear(Number(e.target.value))} placeholder="e.g., 2024" />
            </div>
            <Button onClick={fetchData} size="lg">Fetch Data</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {cbData && (
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
                  />
                </div>
                <Button onClick={handleBank} disabled={!canBank || !bankAmount} className="w-full">
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
                  />
                </div>
                <Button onClick={handleApply} disabled={!canApply || !applyAmount} className="w-full">
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
