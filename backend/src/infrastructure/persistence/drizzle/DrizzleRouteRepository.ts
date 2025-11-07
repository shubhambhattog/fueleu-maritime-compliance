import { RouteRepository } from "../../../domain/ports/outbound/RouteRepository";
import { Route } from "../../../domain/entities/Route";
import { RouteFilters } from "../../../domain/ports/inbound/RouteService";
import { db } from "../../../db";
import { routes } from "../../../db/schema";
import { eq, and, ilike } from "drizzle-orm";

/**
 * Drizzle Route Repository Implementation
 * Implements route persistence using Drizzle ORM + Postgres
 */
export class DrizzleRouteRepository implements RouteRepository {
  async findAll(filters?: RouteFilters): Promise<Route[]> {
    const conditions = [];

    if (filters?.shipId) {
      conditions.push(ilike(routes.shipId, filters.shipId));
    }
    if (filters?.year) {
      conditions.push(eq(routes.year, filters.year));
    }
    if (filters?.vesselType) {
      conditions.push(ilike(routes.vesselType, filters.vesselType));
    }
    if (filters?.fuelType) {
      conditions.push(ilike(routes.fuelType, filters.fuelType));
    }

    const result =
      conditions.length > 0
        ? await db.select().from(routes).where(and(...conditions))
        : await db.select().from(routes);

    return result.map(this.toDomain);
  }

  async findById(routeId: string): Promise<Route | null> {
    const [result] = await db.select().from(routes).where(eq(routes.routeId, routeId));
    return result ? this.toDomain(result) : null;
  }

  async findByShipAndYear(shipId: string, year: number): Promise<Route[]> {
    const result = await db
      .select()
      .from(routes)
      .where(and(eq(routes.shipId, shipId), eq(routes.year, year)));

    return result.map(this.toDomain);
  }

  async findBaselineByYear(year: number): Promise<Route | null> {
    const [result] = await db
      .select()
      .from(routes)
      .where(and(eq(routes.year, year), eq(routes.isBaseline, true)));

    return result ? this.toDomain(result) : null;
  }

  async update(route: Route): Promise<Route> {
    const plain = route.toPlainObject();

    const [updated] = await db
      .update(routes)
      .set({
        isBaseline: plain.isBaseline,
        ghgIntensity: String(plain.ghgIntensity),
        fuelConsumption: String(plain.fuelConsumptionTonnes),
        distance: plain.distanceKm ? String(plain.distanceKm) : null,
        totalEmissions: plain.totalEmissions ? String(plain.totalEmissions) : null,
      })
      .where(eq(routes.routeId, plain.routeId))
      .returning();

    return this.toDomain(updated);
  }

  async create(route: Route): Promise<Route> {
    const plain = route.toPlainObject();

    const [created] = await db
      .insert(routes)
      .values({
        routeId: plain.routeId,
        shipId: plain.shipId,
        year: plain.year,
        vesselType: plain.vesselType,
        fuelType: plain.fuelType,
        ghgIntensity: String(plain.ghgIntensity),
        fuelConsumption: String(plain.fuelConsumptionTonnes),
        distance: plain.distanceKm ? String(plain.distanceKm) : null,
        totalEmissions: plain.totalEmissions ? String(plain.totalEmissions) : null,
        isBaseline: plain.isBaseline,
      })
      .returning();

    return this.toDomain(created);
  }

  async delete(routeId: string): Promise<void> {
    await db.delete(routes).where(eq(routes.routeId, routeId));
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: any): Route {
    return Route.create({
      routeId: row.routeId,
      shipId: row.shipId,
      year: row.year,
      vesselType: row.vesselType,
      fuelType: row.fuelType,
      ghgIntensity: Number(row.ghgIntensity),
      fuelConsumptionTonnes: Number(row.fuelConsumption),
      distanceKm: row.distance ? Number(row.distance) : undefined,
      totalEmissions: row.totalEmissions ? Number(row.totalEmissions) : undefined,
      isBaseline: row.isBaseline ?? false,
    });
  }
}
