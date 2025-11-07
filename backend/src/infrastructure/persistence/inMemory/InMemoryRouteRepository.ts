import { RouteRepository } from "../../../domain/ports/outbound/RouteRepository";
import { Route } from "../../../domain/entities/Route";
import { RouteFilters } from "../../../domain/ports/inbound/RouteService";
import { seededRoutes } from "../../../data/seedRoutes";

/**
 * In-Memory Route Repository Implementation
 * For testing and development without database
 */
export class InMemoryRouteRepository implements RouteRepository {
  private routes: Route[];

  constructor() {
    // Initialize with seed data
    this.routes = seededRoutes.map((r) =>
      Route.create({
        ...r,
        fuelConsumptionTonnes: r.fuelConsumption,
        distanceKm: r.distance,
      })
    );
  }

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    let result = this.routes;

    if (filters?.shipId) {
      result = result.filter((r) =>
        r.getShipId().toLowerCase().includes(filters.shipId!.toLowerCase())
      );
    }
    if (filters?.year) {
      result = result.filter((r) => r.getYear().getValue() === filters.year);
    }
    if (filters?.vesselType) {
      result = result.filter((r) =>
        r.getVesselType().toLowerCase().includes(filters.vesselType!.toLowerCase())
      );
    }
    if (filters?.fuelType) {
      result = result.filter((r) =>
        r.getFuelType().toLowerCase().includes(filters.fuelType!.toLowerCase())
      );
    }

    return result;
  }

  async findById(routeId: string): Promise<Route | null> {
    return this.routes.find((r) => r.getRouteId() === routeId) || null;
  }

  async findByShipAndYear(shipId: string, year: number): Promise<Route[]> {
    return this.routes.filter(
      (r) => r.getShipId() === shipId && r.getYear().getValue() === year
    );
  }

  async findBaselineByYear(year: number): Promise<Route | null> {
    return (
      this.routes.find((r) => r.getYear().getValue() === year && r.getIsBaseline()) || null
    );
  }

  async update(route: Route): Promise<Route> {
    const index = this.routes.findIndex((r) => r.getRouteId() === route.getRouteId());
    if (index === -1) {
      throw new Error(`Route ${route.getRouteId()} not found`);
    }
    this.routes[index] = route;
    return route;
  }

  async create(route: Route): Promise<Route> {
    this.routes.push(route);
    return route;
  }

  async delete(routeId: string): Promise<void> {
    this.routes = this.routes.filter((r) => r.getRouteId() !== routeId);
  }
}
