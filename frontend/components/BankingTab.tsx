"use client";

import { useEffect, useState } from "react";
import { api, type CBResult, type BankEntry } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Banking (Article 20)</h2>

      {/* Ship/Year Selection */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ship ID</label>
          <Input value={shipId} onChange={(e: any) => setShipId(e.target.value)} placeholder="S001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Year</label>
          <Input type="number" value={year} onChange={(e: any) => setYear(Number(e.target.value))} />
        </div>
        <Button onClick={fetchData}>Fetch Data</Button>
      </div>

      {error && <div className="text-red-600 bg-red-50 dark:bg-red-950 p-4 rounded">{error}</div>}

      {cbData && (
        <>
          {/* CB Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-blue-50 dark:bg-blue-950">
              <div className="text-sm text-blue-900 dark:text-blue-100 mb-1">Current CB</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{cbData.cb_t.toFixed(3)} t</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">{cbData.cb_g.toLocaleString()} g CO₂eq</div>
            </Card>

            <Card className="p-4 bg-green-50 dark:bg-green-950">
              <div className="text-sm text-green-900 dark:text-green-100 mb-1">Available Banked</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{(availableBanked / 1_000_000).toFixed(3)} t</div>
              <div className="text-xs text-green-700 dark:text-green-300">{availableBanked.toLocaleString()} g CO₂eq</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-zinc-900 dark:text-zinc-100 mb-1">Status</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {cbData.cb_g > 0 ? "✅ Surplus" : cbData.cb_g < 0 ? "❌ Deficit" : "⚖️ Neutral"}
              </div>
            </Card>
          </div>

          {/* Bank Surplus Form */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Bank Surplus</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (tonnes)</label>
                <Input type="number" step="0.001" value={bankAmount} onChange={(e: any) => setBankAmount(e.target.value)} disabled={!canBank} placeholder="0.000" />
              </div>
              <Button onClick={handleBank} disabled={!canBank || !bankAmount} variant="secondary">Bank</Button>
            </div>
            {!canBank && <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">⚠️ Cannot bank: No positive CB available</p>}
          </Card>

          {/* Apply Banked Form */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Apply Banked Surplus</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (tonnes)</label>
                <Input type="number" step="0.001" value={applyAmount} onChange={(e: any) => setApplyAmount(e.target.value)} disabled={!canApply} placeholder="0.000" />
              </div>
              <Button onClick={handleApply} disabled={!canApply || !applyAmount}>Apply</Button>
            </div>
            {!canApply && <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">⚠️ Cannot apply: No banked surplus available</p>}
          </Card>

          {/* Banking History */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Banking History</h3>
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
                  <TableRow key={record.id}>
                    <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{new Date(record.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      {record.type === "bank" ? <Badge variant="secondary">📥 Bank</Badge> : <Badge variant="default">📤 Apply</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-right text-zinc-900 dark:text-zinc-50">{(record.amount_g / 1_000_000).toFixed(3)}</TableCell>
                    <TableCell className="text-sm text-right text-zinc-600 dark:text-zinc-400">{record.amount_g.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {bankRecords.length === 0 && (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">No banking records found for this ship/year.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
