"use client";

import { useState, useEffect } from "react";
import { api, type CBResult } from "@/lib/api";

interface MemberCB {
  shipId: string;
  cb_g: number;
  cb_t: number;
}

export default function PoolingTab() {
  const [year, setYear] = useState(2024);
  const [availableShips] = useState(["S001", "S002", "S003", "S004", "S005"]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberCBs, setMemberCBs] = useState<MemberCB[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolResult, setPoolResult] = useState<any>(null);

  const toggleMember = (shipId: string) => {
    if (selectedMembers.includes(shipId)) {
      setSelectedMembers(selectedMembers.filter(s => s !== shipId));
    } else {
      setSelectedMembers([...selectedMembers, shipId]);
    }
  };

  const fetchMemberCBs = async () => {
    if (selectedMembers.length === 0) {
      setMemberCBs([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        selectedMembers.map(shipId => api.getAdjustedCB(shipId, year))
      );
      
      const cbs: MemberCB[] = results.map((res, idx) => ({
        shipId: selectedMembers[idx],
        cb_g: res.adjusted_g ?? 0,
        cb_t: (res.adjusted_g ?? 0) / 1_000_000,
      }));
      
      setMemberCBs(cbs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberCBs();
  }, [selectedMembers, year]);

  const poolSum = memberCBs.reduce((sum, m) => sum + m.cb_g, 0);
  const canCreatePool = selectedMembers.length >= 2 && poolSum >= 0;

  const handleCreatePool = async () => {
    if (!canCreatePool) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.createPool(year, selectedMembers);
      setPoolResult(result);
      alert("Pool created successfully!");
      // Refresh CBs to see post-pool state
      await fetchMemberCBs();
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Pooling (Article 21)</h2>

      {/* Year Selection */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      {/* Member Selection */}
      <div className="p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Select Pool Members</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {availableShips.map(shipId => (
            <label
              key={shipId}
              className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-colors ${
                selectedMembers.includes(shipId)
                  ? "bg-blue-100 dark:bg-blue-950 border-2 border-blue-500"
                  : "bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedMembers.includes(shipId)}
                onChange={() => toggleMember(shipId)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{shipId}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Selected: {selectedMembers.length} ships (minimum 2 required)
        </p>
      </div>

      {error && <div className="text-red-600 bg-red-50 dark:bg-red-950 p-4 rounded">{error}</div>}

      {loading && <div className="text-center py-4">Loading pool data...</div>}

      {/* Member CBs (Before Pool) */}
      {memberCBs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Member Adjusted CBs (Before Pool)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ship ID</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">CB (tonnes)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-50">CB (grams)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">Status</th>
                </tr>
              </thead>
              <tbody>
                {memberCBs.map(member => (
                  <tr key={member.shipId} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">{member.shipId}</td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                      {member.cb_t.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-600 dark:text-zinc-400">
                      {member.cb_g.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {member.cb_g > 0 ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✅ Surplus
                        </span>
                      ) : member.cb_g < 0 ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          ❌ Deficit
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          ⚖️ Neutral
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 font-bold">
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">Pool Sum</td>
                  <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                    {(poolSum / 1_000_000).toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-zinc-900 dark:text-zinc-50">
                    {poolSum.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {poolSum >= 0 ? (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✅ Valid Pool
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        ❌ Invalid (Deficit)
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Create Pool Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCreatePool}
          disabled={!canCreatePool || loading}
          className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Pool..." : "Create Pool"}
        </button>
      </div>

      {!canCreatePool && selectedMembers.length > 0 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200 dark:border-orange-900">
          <p className="text-sm text-orange-900 dark:text-orange-100">
            ⚠️ Cannot create pool:
            {selectedMembers.length < 2 && " Need at least 2 members."}
            {poolSum < 0 && " Pool sum is negative (deficit)."}
          </p>
        </div>
      )}

      {/* Pool Result (After Pool) */}
      {poolResult && (
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-900">
          <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">Pool Created Successfully!</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-100 dark:bg-green-900">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-green-900 dark:text-green-100">Ship ID</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-green-900 dark:text-green-100">CB After Pool (t)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-green-900 dark:text-green-100">CB After Pool (g)</th>
                </tr>
              </thead>
              <tbody>
                {poolResult.members.map((member: any) => (
                  <tr key={member.shipId} className="border-t border-green-200 dark:border-green-800">
                    <td className="px-4 py-3 text-sm font-medium text-green-900 dark:text-green-100">{member.shipId}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-900 dark:text-green-100">
                      {(member.cbAfter / 1_000_000).toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-800 dark:text-green-200">
                      {member.cbAfter.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-green-800 dark:text-green-200">
            <strong>Total Transferred:</strong> {(poolResult.totalTransferred / 1_000_000).toFixed(3)} tonnes ({poolResult.totalTransferred.toLocaleString()} g)
          </div>
        </div>
      )}
    </div>
  );
}
