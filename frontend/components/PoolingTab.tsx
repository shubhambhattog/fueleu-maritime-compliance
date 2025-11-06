"use client";

import { useState, useEffect } from "react";
import { api, type CBResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
          <Input type="number" value={year} onChange={(e: any) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {/* Member Selection */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Select Pool Members</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {availableShips.map(shipId => (
            <label
              key={shipId}
              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                selectedMembers.includes(shipId)
                  ? "bg-primary/10 border-2 border-primary shadow-sm"
                  : "bg-muted/50 border-2 border-border hover:border-primary/50"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedMembers.includes(shipId)}
                onChange={() => toggleMember(shipId)}
                className="w-4 h-4 cursor-pointer accent-primary"
              />
              <span className="text-sm font-medium cursor-pointer">{shipId}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Selected: {selectedMembers.length} ships (minimum 2 required)</p>
      </Card>

      {error && <div className="text-red-600 bg-red-50 dark:bg-red-950 p-4 rounded">{error}</div>}

      {loading && <div className="text-center py-4">Loading pool data...</div>}

      {/* Member CBs (Before Pool) */}
      {memberCBs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Member Adjusted CBs (Before Pool)</h3>
          <Table>
            <TableHeader>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <TableHead>Ship ID</TableHead>
                <TableHead className="text-right">CB (tonnes)</TableHead>
                <TableHead className="text-right">CB (grams)</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {memberCBs.map(member => (
                <TableRow key={member.shipId}>
                  <TableCell className="font-medium">{member.shipId}</TableCell>
                  <TableCell className="text-right">{member.cb_t.toFixed(3)}</TableCell>
                  <TableCell className="text-right text-zinc-600 dark:text-zinc-400">{member.cb_g.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {member.cb_g > 0 ? (
                      <Badge variant="secondary">✅ Surplus</Badge>
                    ) : member.cb_g < 0 ? (
                      <Badge variant="destructive">❌ Deficit</Badge>
                    ) : (
                      <Badge variant="default">⚖️ Neutral</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Table>
              <TableBody>
                <TableRow className="border-t-2 border-zinc-300 dark:border-zinc-700 font-bold">
                  <TableCell>Pool Sum</TableCell>
                  <TableCell className="text-right">{(poolSum / 1_000_000).toFixed(3)}</TableCell>
                  <TableCell className="text-right">{poolSum.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {poolSum >= 0 ? <Badge variant="secondary">✅ Valid Pool</Badge> : <Badge variant="destructive">❌ Invalid (Deficit)</Badge>}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create Pool Button */}
      <div className="flex justify-center">
        <Button onClick={handleCreatePool} disabled={!canCreatePool || loading} size="lg">
          {loading ? "Creating Pool..." : "Create Pool"}
        </Button>
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
        <Card className="p-4 bg-green-50 dark:bg-green-950">
          <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">Pool Created Successfully!</h3>
          <Table>
            <TableHeader>
              <tr className="bg-green-100 dark:bg-green-900">
                <TableHead>Ship ID</TableHead>
                <TableHead className="text-right">CB After Pool (t)</TableHead>
                <TableHead className="text-right">CB After Pool (g)</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {poolResult.members.map((member: any) => (
                <TableRow key={member.shipId}>
                  <TableCell className="font-medium text-green-900 dark:text-green-100">{member.shipId}</TableCell>
                  <TableCell className="text-right text-green-900 dark:text-green-100">{((member.cb_after_g ?? 0) / 1_000_000).toFixed(3)}</TableCell>
                  <TableCell className="text-right text-green-800 dark:text-green-200">{(member.cb_after_g ?? 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-sm text-green-800 dark:text-green-200">
            <strong>Pool Sum (After):</strong> {((poolResult.poolSum ?? 0) / 1_000_000).toFixed(3)} tonnes ({(poolResult.poolSum ?? 0).toLocaleString()} g)
          </div>
        </Card>
      )}
    </div>
  );
}
