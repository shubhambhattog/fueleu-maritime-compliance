"use client";

import { useEffect, useState } from "react";
import { api, type CBResult, type BankEntry } from "@/lib/api";

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

  useEffect(() => {
    if (shipId && year) {
      fetchData();
    }
  }, [shipId, year]);

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
          <input
            type="text"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
            placeholder="S001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          />
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Fetch Data
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 dark:bg-red-950 p-4 rounded">{error}</div>}

      {cbData && (
        <>
          {/* CB Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="text-sm text-blue-900 dark:text-blue-100 mb-1">Current CB</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {cbData.cb_t.toFixed(3)} t
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {cbData.cb_g.toLocaleString()} g CO₂eq
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-900">
              <div className="text-sm text-green-900 dark:text-green-100 mb-1">Available Banked</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {(availableBanked / 1_000_000).toFixed(3)} t
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                {availableBanked.toLocaleString()} g CO₂eq
              </div>
            </div>

            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-900 dark:text-zinc-100 mb-1">Status</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {cbData.cb_g > 0 ? "✅ Surplus" : cbData.cb_g < 0 ? "❌ Deficit" : "⚖️ Neutral"}
              </div>
            </div>
          </div>

          {/* Bank Surplus Form */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Bank Surplus</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Amount (tonnes)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  disabled={!canBank}
                  className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
                  placeholder="0.000"
                />
              </div>
              <button
                onClick={handleBank}
                disabled={!canBank || !bankAmount}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bank
              </button>
            </div>
            {!canBank && (
              <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Cannot bank: No positive CB available
              </p>
            )}
          </div>

          {/* Apply Banked Form */}
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Apply Banked Surplus</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Amount (tonnes)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  disabled={!canApply}
                  className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
                  placeholder="0.000"
                />
              </div>
              <button
                onClick={handleApply}
                disabled={!canApply || !applyAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
            {!canApply && (
              <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Cannot apply: No banked surplus available
              </p>
            )}
          </div>

          {/* Banking History */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Banking History</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Amount (t)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">Amount (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {bankRecords.map((record) => (
                    <tr key={record.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          record.type === "bank" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}>
                          {record.type === "bank" ? "📥 Bank" : "📤 Apply"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                        {(record.amount_g / 1_000_000).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-600 dark:text-zinc-400">
                        {record.amount_g.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bankRecords.length === 0 && (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                No banking records found for this ship/year.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
