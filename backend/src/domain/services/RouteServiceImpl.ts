import { RouteService, RouteFilters, ComparisonResult } from "../ports/inbound/RouteService";
import { RouteRepository } from "../ports/outbound/RouteRepository";
import { Route } from "../entities/Route";

/**
 * Route Service Implementation
 * Implements route management use cases
 */
export class RouteServiceImpl implements RouteService {
  constructor(private readonly routeRepository: RouteRepository) {}

  async getAllRoutes(filters?: RouteFilters): Promise<Route[]> {
    return this.routeRepository.findAll(filters);
  }

  async getRouteById(routeId: string): Promise<Route | null> {
    return this.routeRepository.findById(routeId);
  }

  async setAsBaseline(routeId: string): Promise<Route> {
    // Find the route
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    // Find existing baseline for this year
    const year = route.getYear().getValue();
    const existingBaseline = await this.routeRepository.findBaselineByYear(year);

    // Remove baseline from existing if it's a different route
    if (existingBaseline && existingBaseline.getRouteId() !== routeId) {
      existingBaseline.removeBaseline();
      await this.routeRepository.update(existingBaseline);
    }

    // Set this route as baseline
    route.setAsBaseline();
    return this.routeRepository.update(route);
  }

  async getComparison(year: number): Promise<ComparisonResult[]> {
    // Get baseline for this year
    const baseline = await this.routeRepository.findBaselineByYear(year);

    // Get all routes for this year
    const allRoutes = await this.routeRepository.findAll({ year });

    // Compare each route with baseline
    return allRoutes.map(route => {
      if (!baseline || route.getRouteId() === baseline.getRouteId()) {
        return {
          baseline: null,
          comparison: route,
          percentDiff: null,
          compliant: null,
        };
      }

      const percentDiff = baseline.compareIntensityWith(route);
      const compliant = route.getGHGIntensity().getValue() <= baseline.getGHGIntensity().getValue();

      return {
        baseline,
        comparison: route,
        percentDiff,
        compliant,
      };
    });
  }
}
