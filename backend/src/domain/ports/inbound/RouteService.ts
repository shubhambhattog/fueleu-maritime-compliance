import { Route } from "../../entities/Route";

/**
 * Route Service Port (Inbound)
 * Defines use cases for route management
 */

export interface RouteFilters {
  shipId?: string;
  year?: number;
  vesselType?: string;
  fuelType?: string;
}

export interface ComparisonResult {
  baseline: Route | null;
  comparison: Route;
  percentDiff: number | null;
  compliant: boolean | null;
}

export interface RouteService {
  /**
   * Get all routes with optional filters
   */
  getAllRoutes(filters?: RouteFilters): Promise<Route[]>;

  /**
   * Get a single route by ID
   */
  getRouteById(routeId: string): Promise<Route | null>;

  /**
   * Set a route as baseline for its year
   * Only one baseline allowed per year
   */
  setAsBaseline(routeId: string): Promise<Route>;

  /**
   * Get comparison of routes vs baseline for a specific year
   */
  getComparison(year: number): Promise<ComparisonResult[]>;
}
