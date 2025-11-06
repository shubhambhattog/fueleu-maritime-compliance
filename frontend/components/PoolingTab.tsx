"use client";

import { useEffect, useState } from "react";
import { api, type CBResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ship, Users, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";

interface MemberCB {
  shipId: string;
  cb_g: number;
  cb_t: number;
  vesselType?: string;
  fuelType?: string;
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
    setLoading(true);
    setError(null);
    try {
      // Fetch CB data for all available ships to show in the selection table
      const results = await Promise.all(
        availableShips.map(shipId => api.getAdjustedCB(shipId, year))
      );
      
      const cbs: MemberCB[] = results.map((res, idx) => ({
        shipId: availableShips[idx],
        cb_g: res.adjusted_g ?? 0,
        cb_t: (res.adjusted_g ?? 0) / 1_000_000,
        vesselType: 'Container', // In production, fetch from ship data
        fuelType: 'LNG', // In production, fetch from ship data
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
  }, [year]);

  const poolSum = selectedMembers.reduce((sum, shipId) => {
    const member = memberCBs.find(m => m.shipId === shipId);
    return sum + (member?.cb_g ?? 0);
  }, 0);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Pooling</h2>
        <Badge variant="outline" className="text-xs">Article 21</Badge>
      </div>

      {/* Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Pool Year</CardTitle>
          <CardDescription>Choose the year to create a compliance balance pool</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Year</label>
              <Input 
                type="number" 
                value={year} 
                onChange={(e: any) => setYear(Number(e.target.value))} 
                placeholder="e.g., 2024" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Select Pool Members
          </CardTitle>
          <CardDescription>Choose ships to include in the pooling arrangement (minimum 2 required)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-8 text-zinc-500">Loading ship data...</div>}
          {!loading && (
            <>
              <Table>
                <TableHeader>
                  <tr className="bg-zinc-100 dark:bg-zinc-800">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedMembers.length === availableShips.length && availableShips.length > 0}
                        onChange={(e: any) => {
                          if (e.target.checked) {
                            setSelectedMembers([...availableShips]);
                          } else {
                            setSelectedMembers([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Ship ID</TableHead>
                    <TableHead>Vessel Type</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">CB (tonnes)</TableHead>
                    <TableHead className="text-right">CB (grams)</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {memberCBs.map((member) => {
                    const isSelected = selectedMembers.includes(member.shipId);
                    
                    return (
                      <TableRow 
                        key={member.shipId} 
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/5 dark:bg-primary/10' 
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                        onClick={() => toggleMember(member.shipId)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(member.shipId)}
                            className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{member.shipId}</TableCell>
                        <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                          {member.vesselType || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                          {member.fuelType || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-zinc-900 dark:text-zinc-50">
                          {member.cb_t.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-zinc-600 dark:text-zinc-400">
                          {member.cb_g.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.cb_g > 0 ? "secondary" : member.cb_g < 0 ? "destructive" : "outline"} className="gap-1">
                            {member.cb_g > 0 ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                Surplus
                              </>
                            ) : member.cb_g < 0 ? (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                Deficit
                              </>
                            ) : (
                              <>
                                <Minus className="h-3 w-3" />
                                Neutral
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Selected: <span className="font-medium">{selectedMembers.length}</span> of {availableShips.length} ships
                </p>
                {selectedMembers.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedMembers([])}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Member CBs Summary (Before Pool) */}
      {selectedMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pool Summary
            </CardTitle>
            <CardDescription>Combined compliance balance of selected members</CardDescription>
          </CardHeader>
          <CardContent>
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
                {selectedMembers.map(shipId => {
                  const member = memberCBs.find(m => m.shipId === shipId);
                  if (!member) return null;
                  return (
                    <TableRow key={member.shipId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <TableCell className="font-medium">{member.shipId}</TableCell>
                      <TableCell className="text-right text-zinc-900 dark:text-zinc-50">{member.cb_t.toFixed(3)}</TableCell>
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-400">{member.cb_g.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {member.cb_g > 0 ? (
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Surplus
                          </Badge>
                        ) : member.cb_g < 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Deficit
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Minus className="h-3 w-3" />
                            Neutral
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-blue-50 dark:bg-blue-950 font-semibold border-t-2 border-blue-200 dark:border-blue-800">
                  <TableCell>Pool Total</TableCell>
                  <TableCell className="text-right text-blue-900 dark:text-blue-100">{(poolSum / 1_000_000).toFixed(3)}</TableCell>
                  <TableCell className="text-right text-blue-700 dark:text-blue-300">{poolSum.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {poolSum >= 0 ? (
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Invalid</Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Pool Button */}
      {selectedMembers.length > 0 && (
        <div className="flex justify-center">
          <Button 
            onClick={handleCreatePool} 
            disabled={!canCreatePool} 
            size="lg"
            className="min-w-[200px]"
          >
            <Users className="mr-2 h-5 w-5" />
            Create Pool
          </Button>
        </div>
      )}

      {!canCreatePool && selectedMembers.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Cannot create pool:
                {selectedMembers.length < 2 && " Need at least 2 members."}
                {poolSum < 0 && " Pool sum is negative (deficit)."}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pool Result (After Pool) */}
      {poolResult && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-50 dark:bg-green-950">
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Pool Created Successfully
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              All members now share the pooled compliance balance equally
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Member Balances After Pooling</h4>
                <Table>
                  <TableHeader>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      <TableHead>Ship ID</TableHead>
                      <TableHead className="text-right">CB After Pool (t)</TableHead>
                      <TableHead className="text-right">CB After Pool (g)</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {poolResult.members.map((member: any) => (
                      <TableRow key={member.shipId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                        <TableCell className="font-medium">{member.shipId}</TableCell>
                        <TableCell className="text-right text-zinc-900 dark:text-zinc-50">
                          {((member.cb_after_g ?? 0) / 1_000_000).toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                          {(member.cb_after_g ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <div className="text-sm text-green-800 dark:text-green-200">
                  <strong>Pool Sum (After):</strong> {((poolResult.poolSum ?? 0) / 1_000_000).toFixed(3)} tonnes ({(poolResult.poolSum ?? 0).toLocaleString()} g)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
