import express from "express";
import { RouteService } from "../../../../domain/ports/inbound/RouteService";
import { ComplianceService } from "../../../../domain/ports/inbound/ComplianceService";
import { BankingService } from "../../../../domain/ports/inbound/BankingService";
import { PoolingService } from "../../../../domain/ports/inbound/PoolingService";
import { RouteDTO } from "../dtos/RouteDTO";
import { ComplianceDTO } from "../dtos/ComplianceDTO";
import { BankEntryDTO } from "../dtos/BankingDTO";
import { PoolDTO } from "../dtos/PoolDTO";

/**
 * Express Router Factory
 * Creates HTTP routes using hexagonal architecture
 */
export function createRouter(
  routeService: RouteService,
  complianceService: ComplianceService,
  bankingService: BankingService,
  poolingService: PoolingService
): express.Router {
  const router = express.Router();

  // ==================== HEALTH CHECK ====================
  
  router.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "FuelEU Maritime Compliance API"
    });
  });

  // ==================== ROUTES ====================

  router.get("/routes", async (req, res) => {
    try {
      const { shipId, year, vesselType, fuelType } = req.query;

      const routes = await routeService.getAllRoutes({
        shipId: shipId ? String(shipId) : undefined,
        year: year ? Number(year) : undefined,
        vesselType: vesselType ? String(vesselType) : undefined,
        fuelType: fuelType ? String(fuelType) : undefined,
      });

      res.json(RouteDTO.fromDomainArray(routes));
    } catch (error: any) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: error.message || "Failed to fetch routes" });
    }
  });

  router.post("/routes/:routeId/baseline", async (req, res) => {
    try {
      const { routeId } = req.params;
      const route = await routeService.setAsBaseline(routeId);
      res.json({ ok: true, route: RouteDTO.fromDomain(route) });
    } catch (error: any) {
      console.error("Error setting baseline:", error);
      res.status(500).json({ error: error.message || "Failed to set baseline" });
    }
  });

  router.get("/routes/comparison", async (req, res) => {
    try {
      const year = req.query.year ? Number(req.query.year) : 2024;
      const comparisons = await routeService.getComparison(year);

      const result = comparisons.map((c) => ({
        baseline: c.baseline ? RouteDTO.fromDomain(c.baseline) : null,
        comparison: RouteDTO.fromDomain(c.comparison),
        percentDiff: c.percentDiff,
        compliant: c.compliant,
      }));

      res.json({ comparisons: result });
    } catch (error: any) {
      console.error("Error fetching comparison:", error);
      res.status(500).json({ error: error.message || "Failed to fetch comparison" });
    }
  });

  // ==================== COMPLIANCE ====================

  router.get("/compliance/cb", async (req, res) => {
    try {
      const shipId = String(req.query.shipId || "");
      const year = Number(req.query.year || 0);

      if (!shipId || !year) {
        return res.status(400).json({ error: "shipId and year required" });
      }

      const cb = await complianceService.computeComplianceBalance(shipId, year);
      res.json(ComplianceDTO.fromDomain(cb));
    } catch (error: any) {
      console.error("Error computing CB:", error);
      res.status(500).json({ error: error.message || "Failed to compute CB" });
    }
  });

  router.get("/compliance/adjusted-cb", async (req, res) => {
    try {
      const shipId = String(req.query.shipId || "");
      const year = Number(req.query.year || 0);

      if (!shipId || !year) {
        return res.status(400).json({ error: "shipId and year required" });
      }

      const result = await complianceService.getAdjustedComplianceBalance(shipId, year);

      res.json({
        ...ComplianceDTO.fromDomain(result.shipCompliance),
        totalBanked: result.totalBanked,
        totalApplied: result.totalApplied,
        adjusted_g: result.adjusted_g,
      });
    } catch (error: any) {
      console.error("Error computing adjusted CB:", error);
      res.status(500).json({ error: error.message || "Failed to compute adjusted CB" });
    }
  });

  // ==================== BANKING ====================

  router.get("/banking/records", async (req, res) => {
    try {
      const shipId = String(req.query.shipId || "");
      const year = Number(req.query.year || 0);

      if (!shipId || !year) {
        return res.status(400).json({ error: "shipId and year required" });
      }

      const records = await bankingService.getBankingRecords(shipId, year);
      res.json(BankEntryDTO.fromDomainArray(records));
    } catch (error: any) {
      console.error("Error fetching banking records:", error);
      res.status(500).json({ error: error.message || "Failed to fetch banking records" });
    }
  });

  router.post("/banking/bank", async (req, res) => {
    try {
      const { shipId, year, amount_g } = req.body;

      if (!shipId || !year || amount_g === undefined) {
        return res.status(400).json({ error: "shipId, year and amount_g are required" });
      }

      const entry = await bankingService.bankSurplus(shipId, year, amount_g);
      res.json({ ok: true, entry: BankEntryDTO.fromDomain(entry) });
    } catch (error: any) {
      console.error("Error banking surplus:", error);
      res.status(400).json({ error: error.message || "Failed to bank surplus" });
    }
  });

  router.post("/banking/apply", async (req, res) => {
    try {
      const { shipId, year, amount_g } = req.body;

      if (!shipId || !year || amount_g === undefined) {
        return res.status(400).json({ error: "shipId, year and amount_g are required" });
      }

      const entry = await bankingService.applyBankedSurplus(shipId, year, amount_g);
      res.json({ ok: true, entry: BankEntryDTO.fromDomain(entry) });
    } catch (error: any) {
      console.error("Error applying banked surplus:", error);
      res.status(400).json({ error: error.message || "Failed to apply banked surplus" });
    }
  });

  // ==================== POOLING ====================

  router.post("/pools", async (req, res) => {
    try {
      const { year, members } = req.body as { year: number; members: string[] };

      if (!year || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "year and members[] required" });
      }

      const pool = await poolingService.createPool(year, members);
      res.json(PoolDTO.fromDomain(pool));
    } catch (error: any) {
      console.error("Error creating pool:", error);
      res.status(400).json({ error: error.message || "Failed to create pool" });
    }
  });

  return router;
}
