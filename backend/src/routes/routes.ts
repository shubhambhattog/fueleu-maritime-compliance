import express from "express";
import { seededRoutes } from "../data/seedRoutes";
import { computeShipCB } from "../core/computeCB";

const router = express.Router();

// In-memory store (fallback when no DB configured). Mutations operate here.
const routesStore = seededRoutes;

// Simple in-memory bank entries for scaffold
type BankEntry = {
  id: string;
  shipId: string;
  year: number;
  amount_g: number; // grams
  type: "bank" | "apply";
  createdAt: string;
};

const bankEntries: BankEntry[] = [];

// ROUTES
router.get("/routes", (req, res) => {
  const q = req.query;
  let out = routesStore as any[];
  if (q.shipId) out = out.filter((r) => r.shipId === q.shipId);
  if (q.year) out = out.filter((r) => String(r.year) === String(q.year));
  if (q.vesselType) out = out.filter((r) => r.vesselType === q.vesselType);
  if (q.fuelType) out = out.filter((r) => r.fuelType === q.fuelType);
  res.json(out);
});

router.post("/routes/:routeId/baseline", (req, res) => {
  const { routeId } = req.params;
  const found = routesStore.find((r) => r.routeId === routeId);
  if (!found) return res.status(404).json({ error: "Route not found" });
  // unset other baselines for same year
  routesStore.forEach((r) => {
    if (r.year === found.year) r.isBaseline = false;
  });
  found.isBaseline = true;
  res.json({ ok: true, route: found });
});

router.get("/routes/comparison", (req, res) => {
  // Find baseline routes per ship/year then compare others
  const year = req.query.year ? Number(req.query.year) : undefined;
  const baseline = routesStore.filter((r) => r.isBaseline && (year ? r.year === year : true));
  const others = routesStore.filter((r) => !r.isBaseline && (year ? r.year === year : true));

  // For simplicity return baseline array and others array and compute percentDiff where possible
  const comparisons = others.map((o) => {
    const b = baseline.find((bb) => bb.vesselType === o.vesselType && bb.fuelType === o.fuelType && bb.year === o.year);
    const percentDiff = b ? ((o.ghgIntensity / b.ghgIntensity) - 1) * 100 : null;
    const compliant = percentDiff !== null ? ((o.ghgIntensity <= 89.3368) || percentDiff <= -2) : null;
    return { baseline: b || null, comparison: o, percentDiff, compliant };
  });

  res.json({ comparisons });
});

// COMPLIANCE
router.get("/compliance/cb", (req, res) => {
  const shipId = String(req.query.shipId || "");
  const year = Number(req.query.year || 0);
  if (!shipId || !year) return res.status(400).json({ error: "shipId and year required" });
  const cb = computeShipCB(routesStore, shipId, year);
  // In a real DB-backed implementation we'd persist a snapshot in ship_compliance table here
  res.json(cb);
});

// adjusted-cb: computed CB minus banked plus applied (scaffold simplification)
router.get("/compliance/adjusted-cb", (req, res) => {
  const shipId = String(req.query.shipId || "");
  const year = Number(req.query.year || 0);
  if (!shipId || !year) return res.status(400).json({ error: "shipId and year required" });
  const cb = computeShipCB(routesStore, shipId, year);
  const totalBanked = bankEntries.filter((b) => b.shipId === shipId && b.year === year && b.type === "bank").reduce((s, x) => s + x.amount_g, 0);
  const totalApplied = bankEntries.filter((b) => b.shipId === shipId && b.year === year && b.type === "apply").reduce((s, x) => s + x.amount_g, 0);
  const adjusted_g = cb.cb_g - totalBanked + totalApplied;
  res.json({ ...cb, adjusted_g, totalBanked, totalApplied });
});

// BANKING
router.get("/banking/records", (req, res) => {
  const shipId = String(req.query.shipId || "");
  const year = Number(req.query.year || 0);
  let out = bankEntries as BankEntry[];
  if (shipId) out = out.filter((b) => b.shipId === shipId);
  if (year) out = out.filter((b) => b.year === year);
  res.json(out);
});

router.post("/banking/bank", (req, res) => {
  const { shipId, year, amount_g } = req.body as { shipId: string; year: number; amount_g: number };
  if (!shipId || !year || typeof amount_g !== "number") return res.status(400).json({ error: "shipId, year and amount_g are required" });
  const cb = computeShipCB(routesStore, shipId, year);
  if (cb.cb_g <= 0) return res.status(400).json({ error: "No positive CB to bank" });
  if (amount_g > cb.cb_g) return res.status(400).json({ error: "Amount exceeds available surplus" });
  const entry: BankEntry = { id: `${Date.now()}`, shipId, year, amount_g, type: "bank", createdAt: new Date().toISOString() };
  bankEntries.push(entry);
  res.json({ ok: true, entry });
});

router.post("/banking/apply", (req, res) => {
  const { shipId, year, amount_g } = req.body as { shipId: string; year: number; amount_g: number };
  if (!shipId || !year || typeof amount_g !== "number") return res.status(400).json({ error: "shipId, year and amount_g are required" });
  // available banked = sum(bank) - sum(apply)
  const totalBanked = bankEntries.filter((b) => b.shipId === shipId && b.year === year && b.type === "bank").reduce((s, x) => s + x.amount_g, 0);
  const totalApplied = bankEntries.filter((b) => b.shipId === shipId && b.year === year && b.type === "apply").reduce((s, x) => s + x.amount_g, 0);
  const available = totalBanked - totalApplied;
  if (amount_g > available) return res.status(400).json({ error: "Amount exceeds available banked surplus" });
  const entry: BankEntry = { id: `${Date.now()}`, shipId, year, amount_g, type: "apply", createdAt: new Date().toISOString() };
  bankEntries.push(entry);
  res.json({ ok: true, entry });
});

// POOLS
router.post("/pools", (req, res) => {
  const { year, members } = req.body as { year: number; members: string[] };
  if (!year || !Array.isArray(members) || members.length === 0) return res.status(400).json({ error: "year and members[] required" });

  // compute cb before for each member
  type Member = { shipId: string; cb_before_g: number; cb_after_g: number };
  const membersState: Member[] = members.map((s) => {
    const cb = computeShipCB(routesStore, s, year);
    return { shipId: s, cb_before_g: cb.cb_g, cb_after_g: cb.cb_g };
  });

  const total = membersState.reduce((s, m) => s + m.cb_before_g, 0);
  if (total < 0) return res.status(400).json({ error: "Sum(adjustedCB) must be >= 0" });

  // Greedy allocation: donors sorted desc by cb_before_g
  const donors = membersState.filter((m) => m.cb_before_g > 0).sort((a, b) => b.cb_before_g - a.cb_before_g);
  const deficits = membersState.filter((m) => m.cb_before_g < 0).sort((a, b) => a.cb_before_g - b.cb_before_g); // most negative first

  for (const d of deficits) {
    let need = Math.abs(d.cb_after_g);
    for (const donor of donors) {
      if (need <= 0) break;
      const available = Math.max(0, donor.cb_after_g);
      if (available <= 0) continue;
      const transfer = Math.min(available, need);
      donor.cb_after_g = donor.cb_after_g - transfer;
      d.cb_after_g = d.cb_after_g + transfer;
      need -= transfer;
    }
    // after trying to satisfy this deficit, if still need > 0 then pool invalid
    if (Math.abs(d.cb_after_g) > 0 && d.cb_after_g < 0) {
      return res.status(400).json({ error: "Unable to fully cover deficits with available surplus without violating rules" });
    }
  }

  // verify rules: donors non-negative, deficits not worse
  for (const m of membersState) {
    if (m.cb_after_g < 0 && m.cb_before_g > 0) return res.status(400).json({ error: "Surplus ship cannot exit negative" });
    if (m.cb_after_g < m.cb_before_g && m.cb_before_g < 0) return res.status(400).json({ error: "Deficit ship exit worse" });
  }

  const poolSum = membersState.reduce((s, m) => s + m.cb_after_g, 0);
  res.json({ year, poolSum, members: membersState });
});

export default router;
