import express from "express";
import { db } from "../db";
import { routes, bankEntries as bankEntriesTable, pools, poolMembers } from "../db/schema";
import { computeShipCB } from "../core/computeCB";
import { eq, and } from "drizzle-orm";

const router = express.Router();

// Helper function to fetch routes from DB
async function fetchRoutesFromDB(shipId: string, year: number) {
  const dbRoutes = await db.select().from(routes)
    .where(and(eq(routes.shipId, shipId), eq(routes.year, year)));
  
  return dbRoutes.map(r => ({
    routeId: r.routeId,
    shipId: r.shipId,
    year: r.year,
    vesselType: r.vesselType,
    fuelType: r.fuelType,
    ghgIntensity: Number(r.ghgIntensity),
    fuelConsumption: Number(r.fuelConsumption),
    distance: r.distance ? Number(r.distance) : undefined,
    totalEmissions: r.totalEmissions ? Number(r.totalEmissions) : undefined,
    isBaseline: r.isBaseline,
  }));
}

// ROUTES
router.get("/routes", async (req, res) => {
  try {
    const { shipId, year, vesselType, fuelType } = req.query;
    
    const conditions = [];
    if (shipId) conditions.push(eq(routes.shipId, String(shipId)));
    if (year) conditions.push(eq(routes.year, Number(year)));
    if (vesselType) conditions.push(eq(routes.vesselType, String(vesselType)));
    if (fuelType) conditions.push(eq(routes.fuelType, String(fuelType)));
    
    const result = conditions.length > 0 
      ? await db.select().from(routes).where(and(...conditions))
      : await db.select().from(routes);
    
    res.json(result.map(r => ({
      routeId: r.routeId,
      shipId: r.shipId,
      year: r.year,
      vesselType: r.vesselType,
      fuelType: r.fuelType,
      ghgIntensity: Number(r.ghgIntensity),
      fuelConsumption: Number(r.fuelConsumption),
      distance: r.distance ? Number(r.distance) : undefined,
      totalEmissions: r.totalEmissions ? Number(r.totalEmissions) : undefined,
      isBaseline: r.isBaseline,
    })));
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

router.post("/routes/:routeId/baseline", async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const [found] = await db.select().from(routes).where(eq(routes.routeId, routeId));
    if (!found) return res.status(404).json({ error: "Route not found" });
    
    // Unset other baselines for same year
    await db.update(routes)
      .set({ isBaseline: false })
      .where(eq(routes.year, found.year));
    
    // Set this route as baseline
    await db.update(routes)
      .set({ isBaseline: true, updatedAt: new Date() })
      .where(eq(routes.routeId, routeId));
    
    const [updated] = await db.select().from(routes).where(eq(routes.routeId, routeId));
    res.json({ ok: true, route: updated });
  } catch (error) {
    console.error("Error setting baseline:", error);
    res.status(500).json({ error: "Failed to set baseline" });
  }
});

router.get("/routes/comparison", async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    
    const allRoutes = year 
      ? await db.select().from(routes).where(eq(routes.year, year))
      : await db.select().from(routes);
    
    const baseline = allRoutes.filter(r => r.isBaseline);
    const others = allRoutes.filter(r => !r.isBaseline);
    
    const comparisons = others.map(o => {
      const b = baseline.find(bb => 
        bb.vesselType === o.vesselType && 
        bb.fuelType === o.fuelType && 
        bb.year === o.year
      );
      const percentDiff = b ? ((Number(o.ghgIntensity) / Number(b.ghgIntensity)) - 1) * 100 : null;
      const compliant = percentDiff !== null ? ((Number(o.ghgIntensity) <= 89.3368) || percentDiff <= -2) : null;
      return { 
        baseline: b ? {
          routeId: b.routeId,
          vesselType: b.vesselType,
          fuelType: b.fuelType,
          ghgIntensity: Number(b.ghgIntensity),
        } : null, 
        comparison: {
          routeId: o.routeId,
          vesselType: o.vesselType,
          fuelType: o.fuelType,
          ghgIntensity: Number(o.ghgIntensity),
        }, 
        percentDiff, 
        compliant 
      };
    });
    
    res.json({ comparisons });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    res.status(500).json({ error: "Failed to fetch comparison" });
  }
});

// COMPLIANCE
router.get("/compliance/cb", async (req, res) => {
  try {
    const shipId = String(req.query.shipId || "");
    const year = Number(req.query.year || 0);
    if (!shipId || !year) return res.status(400).json({ error: "shipId and year required" });
    
    const shipRoutes = await fetchRoutesFromDB(shipId, year);
    const cb = computeShipCB(shipRoutes, shipId, year);
    
    res.json(cb);
  } catch (error) {
    console.error("Error computing CB:", error);
    res.status(500).json({ error: "Failed to compute CB" });
  }
});

// adjusted-cb: computed CB minus banked plus applied
router.get("/compliance/adjusted-cb", async (req, res) => {
  try {
    const shipId = String(req.query.shipId || "");
    const year = Number(req.query.year || 0);
    if (!shipId || !year) return res.status(400).json({ error: "shipId and year required" });
    
    const shipRoutes = await fetchRoutesFromDB(shipId, year);
    const cb = computeShipCB(shipRoutes, shipId, year);
    
    const bankEntriesData = await db.select().from(bankEntriesTable)
      .where(and(eq(bankEntriesTable.shipId, shipId), eq(bankEntriesTable.year, year)));
    
    const totalBanked = bankEntriesData
      .filter(b => b.type === "bank")
      .reduce((s, x) => s + Number(x.amountG), 0);
    
    const totalApplied = bankEntriesData
      .filter(b => b.type === "apply")
      .reduce((s, x) => s + Number(x.amountG), 0);
    
    const adjusted_g = cb.cb_g - totalBanked + totalApplied;
    res.json({ ...cb, adjusted_g, totalBanked, totalApplied });
  } catch (error) {
    console.error("Error computing adjusted CB:", error);
    res.status(500).json({ error: "Failed to compute adjusted CB" });
  }
});

// BANKING
router.get("/banking/records", async (req, res) => {
  try {
    const shipId = String(req.query.shipId || "");
    const year = Number(req.query.year || 0);
    
    const conditions = [];
    if (shipId) conditions.push(eq(bankEntriesTable.shipId, shipId));
    if (year) conditions.push(eq(bankEntriesTable.year, year));
    
    const result = conditions.length > 0
      ? await db.select().from(bankEntriesTable).where(and(...conditions))
      : await db.select().from(bankEntriesTable);
    
    res.json(result.map(r => ({
      id: String(r.id),
      shipId: r.shipId,
      year: r.year,
      amount_g: Number(r.amountG),
      type: r.type,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error("Error fetching bank records:", error);
    res.status(500).json({ error: "Failed to fetch bank records" });
  }
});

router.post("/banking/bank", async (req, res) => {
  try {
    const { shipId, year, amount_g } = req.body as { shipId: string; year: number; amount_g: number };
    if (!shipId || !year || typeof amount_g !== "number") {
      return res.status(400).json({ error: "shipId, year and amount_g are required" });
    }
    
    const shipRoutes = await fetchRoutesFromDB(shipId, year);
    const cb = computeShipCB(shipRoutes, shipId, year);
    
    if (cb.cb_g <= 0) return res.status(400).json({ error: "No positive CB to bank" });
    if (amount_g > cb.cb_g) return res.status(400).json({ error: "Amount exceeds available surplus" });
    
    const [entry] = await db.insert(bankEntriesTable).values({
      shipId,
      year,
      amountG: String(amount_g),
      type: "bank",
    }).returning();
    
    res.json({ ok: true, entry });
  } catch (error) {
    console.error("Error banking surplus:", error);
    res.status(500).json({ error: "Failed to bank surplus" });
  }
});

router.post("/banking/apply", async (req, res) => {
  try {
    const { shipId, year, amount_g } = req.body as { shipId: string; year: number; amount_g: number };
    if (!shipId || !year || typeof amount_g !== "number") {
      return res.status(400).json({ error: "shipId, year and amount_g are required" });
    }
    
    const bankEntriesData = await db.select().from(bankEntriesTable)
      .where(and(eq(bankEntriesTable.shipId, shipId), eq(bankEntriesTable.year, year)));
    
    const totalBanked = bankEntriesData
      .filter(b => b.type === "bank")
      .reduce((s, x) => s + Number(x.amountG), 0);
    
    const totalApplied = bankEntriesData
      .filter(b => b.type === "apply")
      .reduce((s, x) => s + Number(x.amountG), 0);
    
    const available = totalBanked - totalApplied;
    if (amount_g > available) {
      return res.status(400).json({ error: "Amount exceeds available banked surplus" });
    }
    
    const [entry] = await db.insert(bankEntriesTable).values({
      shipId,
      year,
      amountG: String(amount_g),
      type: "apply",
    }).returning();
    
    res.json({ ok: true, entry });
  } catch (error) {
    console.error("Error applying banked surplus:", error);
    res.status(500).json({ error: "Failed to apply banked surplus" });
  }
});

// POOLS
router.post("/pools", async (req, res) => {
  try {
    const { year, members } = req.body as { year: number; members: string[] };
    if (!year || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "year and members[] required" });
    }
    
    type Member = { shipId: string; cb_before_g: number; cb_after_g: number };
    const membersState: Member[] = [];
    
    for (const shipId of members) {
      const shipRoutes = await fetchRoutesFromDB(shipId, year);
      const cb = computeShipCB(shipRoutes, shipId, year);
      membersState.push({ shipId, cb_before_g: cb.cb_g, cb_after_g: cb.cb_g });
    }
    
    const total = membersState.reduce((s, m) => s + m.cb_before_g, 0);
    if (total < 0) return res.status(400).json({ error: "Sum(adjustedCB) must be >= 0" });
    
    // Greedy allocation
    const donors = membersState.filter(m => m.cb_before_g > 0).sort((a, b) => b.cb_before_g - a.cb_before_g);
    const deficits = membersState.filter(m => m.cb_before_g < 0).sort((a, b) => a.cb_before_g - b.cb_before_g);
    
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
      if (Math.abs(d.cb_after_g) > 0 && d.cb_after_g < 0) {
        return res.status(400).json({ error: "Unable to fully cover deficits with available surplus without violating rules" });
      }
    }
    
    // Verify rules
    for (const m of membersState) {
      if (m.cb_after_g < 0 && m.cb_before_g > 0) {
        return res.status(400).json({ error: "Surplus ship cannot exit negative" });
      }
      if (m.cb_after_g < m.cb_before_g && m.cb_before_g < 0) {
        return res.status(400).json({ error: "Deficit ship exit worse" });
      }
    }
    
    const poolSum = membersState.reduce((s, m) => s + m.cb_after_g, 0);
    res.json({ year, poolSum, members: membersState });
  } catch (error) {
    console.error("Error creating pool:", error);
    res.status(500).json({ error: "Failed to create pool" });
  }
});

export default router;
