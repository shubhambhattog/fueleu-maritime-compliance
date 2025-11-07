import { Route } from "../../entities/Route";
import { RouteFilters } from "../inbound/RouteService";

/**
 * Route Repository Port (Outbound)
 * Contract for route data persistence
 */
export interface RouteRepository {
  /**
   * Find all routes with optional filters
   */
  findAll(filters?: RouteFilters): Promise<Route[]>;

  /**
   * Find a route by its ID
   */
  findById(routeId: string): Promise<Route | null>;

  /**
   * Find all routes for a specific ship and year
   */
  findByShipAndYear(shipId: string, year: number): Promise<Route[]>;

  /**
   * Find the baseline route for a specific year
   */
  findBaselineByYear(year: number): Promise<Route | null>;

  /**
   * Update a route
   */
  update(route: Route): Promise<Route>;

  /**
   * Create a new route (optional - for future use)
   */
  create(route: Route): Promise<Route>;

  /**
   * Delete a route (optional - for future use)
   */
  delete(routeId: string): Promise<void>;
}
